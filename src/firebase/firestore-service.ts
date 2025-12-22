import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDocs,
  increment,
  runTransaction,
  getDoc,
  documentId, query, where,
  deleteField,
  collectionGroup
} from '@angular/fire/firestore';
import { ActionType, FIREBASE_PATHS,ACTIONS,BrowserId, APP_LIMITS } from '../constants/actionConstants';

@Injectable({ providedIn: 'root' })
export class firebaseService {

  private firestore = inject(Firestore);
  private injector = inject(Injector);


  async getStoryCountsBulk(storyIds: string[],browserId: string) {
    return await runInInjectionContext(this.injector, async () => {
  
      if (!storyIds?.length) {
        return [];
      }
  
      if (storyIds.length > APP_LIMITS.STORY_ID_QUERY_LIMIT) {
        throw new Error('Max 100 storyIds allowed');
      }
  
      /* -------------------------------------------------
       * 1️⃣ Fetch ALL story documents (SINGLE API call)
       * ------------------------------------------------- */
      const storySnap = await getDocs(query(collection(this.firestore, FIREBASE_PATHS.ROOT),where(documentId(), 'in', storyIds)));
  
      const storyMap = new Map<string, any>();
      storySnap.docs.forEach(docSnap => {storyMap.set(docSnap.id, docSnap.data())});
  
      /* -------------------------------------------------
       * 2️⃣ Check browser likes in PARALLEL (Promise.all)
       * ------------------------------------------------- */
      const likeChecks = storyIds.map(storyId =>

        getDoc(
          doc(
            this.firestore,
            FIREBASE_PATHS.ROOT,
            storyId,
            FIREBASE_PATHS.SUB_COLLECTION,
            browserId
          )
        )
      );
  
      const browserSnaps = await Promise.all(likeChecks);
  
      const likeMap = new Map<string, number>();

      browserSnaps.forEach((snap, index) => {
        likeMap.set(storyIds[index], snap.exists() ? 1 : 0)
      });
  
      /* -------------------------------------------------
       * 3️⃣ Merge results in memory (NO API calls)
       * ------------------------------------------------- */
      return storyIds.map(storyId => {
        const data = storyMap.get(storyId);
  
        return {
          storyId,
          likesCount: data?.likesCount ?? 0,
          shareCount: data?.shareCount ?? 0,
          downloadCount: data?.downloadCount ?? 0,
          like: likeMap.get(storyId) ?? 0
        };
      });
    });
  }
  


  async updateRecord(story: any,browserId: BrowserId,action: ActionType) {

    return await runInInjectionContext(this.injector, async () => {

      return await runTransaction(this.firestore, async (transaction) => {
  
        const storyRef = doc(this.firestore,FIREBASE_PATHS.ROOT,story.storyId);
  
        const browserRef = doc(storyRef,FIREBASE_PATHS.SUB_COLLECTION,browserId);
  
        /* =====================================================
         * LIKE
         * ===================================================== */
        if (action === ACTIONS.LIKE) {
  
          if (story.like === 0) {
            // UNLIKE → delete browserId
            transaction.delete(browserRef);
  
            transaction.set(
              storyRef,
              { 
                likesCount: action === ACTIONS.LIKE ?story.shareCount -1  :story.likesCount,
              shareCount: story.shareCount,
              downloadCount: story.downloadCount
              },
              { merge: true }
            );
  
            return {
              status: 200,
              storyId: story.storyId,
              action,
              diff: -1
            };
          }
  
          // LIKE → add browserId
          transaction.set(browserRef, {});
  
          transaction.set(
            storyRef,
            { 
              likesCount: action === ACTIONS.LIKE ?story.shareCount +1  :story.likesCount,
              shareCount: story.shareCount,
              downloadCount: story.downloadCount
             },
            { merge: true }
          );
  
          return {
            status: 200,
            storyId: story.storyId,
            action,
            diff: 1
          };
        }
  
        /* =====================================================
         * SHARE / DOWNLOAD
         * ===================================================== */
  
        transaction.set(
          storyRef,
          { 
            likesCount:story.likesCount,
            shareCount:action === ACTIONS.SHARE ? story.shareCount+1 : story.shareCount,
            downloadCount:action === ACTIONS.DOWNLOAD ? story.downloadCount+1 : story.downloadCount
          },
          { merge: true }
        );
  
        return {
          status: 200,
          storyId: story.storyId,
          action,
          diff:1
        };
      });
    });
  }


  
}
