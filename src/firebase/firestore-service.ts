import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import {
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs
} from '@angular/fire/firestore';
import { FIREBASE_PATHS } from '../constants/actionContants';

@Injectable({ providedIn: 'root' })
export class SgFirebaseService {

  private firestore = inject(Firestore);
  private injector = inject(Injector);

  // ------------------------------------------
  // GET RECORD (browserId)
  // ------------------------------------------
  async getRecord(storyId: string, browserId: string) {
    return await runInInjectionContext(this.injector, async () => {

      const ref = doc(this.firestore, FIREBASE_PATHS.ROOT, storyId, FIREBASE_PATHS.SUB_COLLECTION, browserId);
      const snap = await getDoc(ref);

      return snap.exists() ? snap.data() : null;
    });
  }

  // ------------------------------------------
  // CREATE RECORD (browserId)
  // ------------------------------------------
  async createRecord(storyId: string, browserId: string, data: any) {
    return await runInInjectionContext(this.injector, async () => {

      const storyRef = doc(this.firestore, FIREBASE_PATHS.ROOT, storyId);
      await setDoc(storyRef, {
        likesCount: 0,
        shareCount: 0,
        downloadCount: 0
      }, { merge: true });

      const browserRef = doc(this.firestore, FIREBASE_PATHS.ROOT, storyId, FIREBASE_PATHS.SUB_COLLECTION, browserId);

      await setDoc(browserRef, {
        like: data.like ?? 0,
        share: data.share ?? 0,
        download: data.download ?? 0
      });

      await this.updateStoryTotals(storyId);

      return browserRef;
    });
  }

  // ------------------------------------------
  // UPDATE RECORD (browserId)
  // ------------------------------------------
  async updateRecord(storyId: string, browserId: string, data: any) {
    return await runInInjectionContext(this.injector, async () => {

      const ref = doc(this.firestore, FIREBASE_PATHS.ROOT, storyId, FIREBASE_PATHS.SUB_COLLECTION, browserId);

      await updateDoc(ref, data);

      await this.updateStoryTotals(storyId);

    });
  }

  // ------------------------------------------
  // RE-CALCULATE TOTALS (likes, share, download)
  // ------------------------------------------
  async updateStoryTotals(storyId: string) {
    return await runInInjectionContext(this.injector, async () => {

      const browsersRef = collection(this.firestore, FIREBASE_PATHS.ROOT, storyId, FIREBASE_PATHS.SUB_COLLECTION);
      const snap = await getDocs(browsersRef);

      let likes = 0, shares = 0, downloads = 0;

      snap.forEach(docSnap => {
        const d: any = docSnap.data();
        likes += d.like || 0;
        shares += d.share || 0;
        downloads += d.download || 0;
      });

      const storyRef = doc(this.firestore, FIREBASE_PATHS.ROOT, storyId);

      await updateDoc(storyRef, {
        likesCount: likes,
        shareCount: shares,
        downloadCount: downloads
      });

      return { likes, shares, downloads };
    });
  }


  // ------------------------------------------
  // GET-CALCULATE TOTALS (likes, share, download)
  // ------------------------------------------
  async getStoryCounts(storyId: string) {
    return await runInInjectionContext(this.injector, async () => {
  
      const storyRef = doc(this.firestore, FIREBASE_PATHS.ROOT, storyId);
      const snap = await getDoc(storyRef);
  
      if (!snap.exists()) {
        return { likesCount: 0, shareCount: 0, downloadCount: 0 };
      }
  
      const data: any = snap.data();
  
      return {
        likesCount: data.likesCount || 0,
        shareCount: data.shareCount || 0,
        downloadCount: data.downloadCount || 0
      };
    });
  }
  
}
