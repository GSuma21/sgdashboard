import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  increment,
  runTransaction,
  documentId, query, where
} from '@angular/fire/firestore';
import { ActionType, FIREBASE_PATHS,ACTIONS } from '../constants/actionContants';

@Injectable({ providedIn: 'root' })
export class SgFirebaseService {
  limit:any=100;

  private firestore = inject(Firestore);
  private injector = inject(Injector);


  async getStoryCountsBulk(storyIds: string[]) {
    return await runInInjectionContext(this.injector, async () => {
  
      if (storyIds.length > this.limit) {
        throw new Error('Firestore supports max 100 storyIds per request');
      }

      const snap = await getDocs(query(
        collection(this.firestore, FIREBASE_PATHS.ROOT),
        where(documentId(), 'in', storyIds)
      ));

      return snap.docs.map((docSnap:any) => ({
        storyId: docSnap.id,
        ...docSnap.data()
      }));
    });
  }
  

async updateAction(storyId: string,browserId: string,action: ActionType,) {
  return await runInInjectionContext(this.injector, async () => {
    return await runTransaction(this.firestore, async (tx) => {
      const storyRef = doc(this.firestore, FIREBASE_PATHS.ROOT, storyId);
      const browserRef = doc(storyRef, FIREBASE_PATHS.SUB_COLLECTION, browserId);

      const storySnap = await tx.get(storyRef);

      if (!storySnap.exists()) {
        tx.set(storyRef, {
          likesCount: action === ACTIONS.LIKE ? 1 : 0,
          shareCount:action === ACTIONS.SHARE ? 1 : 0,
          downloadCount: action === ACTIONS.DOWNLOAD ? 1 : 0
        }, { merge: true });

        tx.set(browserRef, {
          like: action === ACTIONS.LIKE ? 1 : 0,
          share: action === ACTIONS.SHARE ? 1 : 0,
          download: action === ACTIONS.DOWNLOAD ? 1 : 0
        });

        return {
          status: 201, 
          success: true,
          message: 'Story and browser record created',
          action,
          storyId:storyId,
          diff: 1
        };;
      }

      const browserSnap = await tx.get(browserRef);

      const record = browserSnap.exists()
        ? (browserSnap.data() as { like: number; share: number; download: number })
        : { like: 0, share: 0, download: 0 };

      const oldValue = record[action as keyof typeof record] || 0;

      const newValue = action === ACTIONS.LIKE ? (oldValue === 1 ? 0 : 1) : oldValue + 1;

      tx.set(browserRef, {
        like: action === ACTIONS.LIKE ? newValue : record.like,
        share: action === ACTIONS.SHARE ? newValue : record.share,
        download: action === ACTIONS.DOWNLOAD ? newValue : record.download
      }, { merge: true });

      const fieldMap: Record<ActionType, string> = {
        [ACTIONS.LIKE]: 'likesCount',
        [ACTIONS.SHARE]: 'shareCount',
        [ACTIONS.DOWNLOAD]: 'downloadCount'
      };

      const diff =action === ACTIONS.LIKE ? (newValue === 1 ? 1 : -1) : 1;

      tx.update(storyRef, {
        [fieldMap[action]]: increment(diff)
      });

      return {
        status: 200,
        success: true,
        message: 'Action updated successfully',
        action,
        storyId:storyId,
        diff:diff
    };
    });
  });
}


  
}
