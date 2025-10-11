import { ApplicationRef, ComponentRef, createComponent, EnvironmentInjector, Injectable, Type, inject } from '@angular/core';
import { Subject } from 'rxjs';

export interface ModalConfig {
  title: string;
  data?: any;
}

export interface ModalRef<T = any> {
  close: (result?: T) => void;
  dismiss: (reason?: any) => void;
  result: Promise<T>;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private appRef = inject(ApplicationRef);
  private injector = inject(EnvironmentInjector);

  open<T extends object, R = any>(component: Type<T>, config: ModalConfig): ModalRef<R> {
    // Create modal wrapper
    const modalWrapperElement = document.createElement('div');
    modalWrapperElement.classList.add('modal-backdrop');
    document.body.appendChild(modalWrapperElement);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Create promise for result
    const resultSubject = new Subject<R>();
    const resultPromise = new Promise<R>((resolve, reject) => {
      resultSubject.subscribe({
        next: (value) => resolve(value),
        error: (err) => reject(err)
      });
    });

    // Create component refs that will be assigned
    let componentRef: ComponentRef<T> | null = null;
    let modalWrapperRef: ComponentRef<ModalWrapperComponent> | null = null;

    const cleanup = () => {
      document.body.style.overflow = '';
      if (componentRef) {
        this.appRef.detachView(componentRef.hostView);
        componentRef.destroy();
      }
      if (modalWrapperRef) {
        this.appRef.detachView(modalWrapperRef.hostView);
        modalWrapperRef.destroy();
      }
      if (modalWrapperElement.parentNode) {
        modalWrapperElement.parentNode.removeChild(modalWrapperElement);
      }
    };

    // Create close and dismiss functions
    const closeModal = (result?: R) => {
      resultSubject.next(result!);
      resultSubject.complete();
      cleanup();
    };

    const dismissModal = (reason?: any) => {
      resultSubject.error(reason);
      cleanup();
    };

    // Create modal ref
    const modalRef: ModalRef<R> = {
      close: closeModal,
      dismiss: dismissModal,
      result: resultPromise
    };

    // Create modal wrapper component
    modalWrapperRef = createComponent(ModalWrapperComponent, {
      environmentInjector: this.injector,
      hostElement: modalWrapperElement
    });

    modalWrapperRef.instance.title = config.title;
    modalWrapperRef.instance.onClose = () => dismissModal('dismissed');

    // Attach wrapper view first
    this.appRef.attachView(modalWrapperRef.hostView);

    // Wait for the wrapper to render, then find the modal-container
    setTimeout(() => {
      const modalContainer = modalWrapperElement.querySelector('.modal-container');
      if (modalContainer) {
        // Create the actual component inside the modal-container
        componentRef = createComponent(component, {
          environmentInjector: this.injector
        });

        // Pass data to component if it has a data property
        if (config.data && 'data' in componentRef.instance) {
          (componentRef.instance as any).data = config.data;
        }

        // Pass modalRef to component if it has a modalRef property
        if ('modalRef' in componentRef.instance) {
          (componentRef.instance as any).modalRef = modalRef;
        }

        // Attach the component view and append to modal container
        this.appRef.attachView(componentRef.hostView);
        const componentElement = (componentRef.hostView as any).rootNodes[0];
        modalContainer.appendChild(componentElement);
      }
    }, 0);

    // Handle backdrop click
    modalWrapperElement.addEventListener('click', (event) => {
      if (event.target === modalWrapperElement) {
        dismissModal('backdrop-click');
      }
    });

    return modalRef;
  }
}

// Modal Wrapper Component
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-modal-wrapper',
  standalone: true,
  template: `
    <div class="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-gray-900 bg-opacity-50">
      <div class="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
          <button
            type="button"
            (click)="onClose()"
            class="text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="modal-container overflow-y-auto p-6 flex-1"></div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ModalWrapperComponent {
  @Input() title: string = '';
  onClose: () => void = () => {};
}
