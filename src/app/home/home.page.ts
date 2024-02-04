import { Component, ElementRef, ViewChild } from '@angular/core';
import { Camera, CameraResultType, CameraSource, } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {

  //npm install @capacitor/camera

  @ViewChild('zoomableImage') zoomableImage: ElementRef | any;
  imgElementRef: ElementRef | any;
  capturedImage: any;
  image: any;
  imageUrl: SafeUrl | null = null;

  constructor(private domSanitizer: DomSanitizer) { }

  ionViewWillLeave() {
    this.capturedImage = null;
  }

  checkPlatformForWeb() {
    if (Capacitor.getPlatform() == 'web' || Capacitor.getPlatform() === 'android') return true
    return false
  }

  async takePictureAndCompress() {
    try {
      const image = await Camera.getPhoto({
        quality: 100,
        source: CameraSource.Prompt,
        saveToGallery: true,
        allowEditing: false,
        resultType: this.checkPlatformForWeb() ? CameraResultType.DataUrl : CameraResultType.Uri
      });

      this.capturedImage = image;

      if (this.checkPlatformForWeb() && image.dataUrl) {
        this.capturedImage.webPath = image.dataUrl;
      }

      await this.compressAndDisplayImage(image);
    } catch (error) {
      console.error('Error capturing or compressing image:', error);
    }

  }

  async compressAndDisplayImage(image: any) {
    return new Promise<void>((resolve, reject) => {
      const imageUrl = this.checkPlatformForWeb() ? image.dataUrl : Capacitor.convertFileSrc(image.webPath);

      const img = new Image();

      img.src = imageUrl;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context is not available.'));
          return;
        }

        const maxWidth = 1400;
        const maxHeight = 1200;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);

        const compressedImage = new Image();
        compressedImage.onload = () => {
          document.body.appendChild(compressedImage);
          resolve();
        };
        compressedImage.onerror = (error) => {
          reject(new Error('Error loading compressed image: ' + error));
        };
        compressedImage.src = compressedBase64;

        console.log(compressedImage.src)

        this.convertBase64URLToPNG(compressedImage.src);
      };

      img.onerror = (error) => {
        reject(new Error('Error loading original image: ' + error));
      };
    });
  }

  convertBase64URLToPNG(base64URL: any) {
    fetch(base64URL)
      .then(response => response.blob())
      .then(blob => {
        this.imageUrl = this.domSanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob));
      })
      .catch(error => {
        console.error('Error fetching the image:', error);
      });
  }
}