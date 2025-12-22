import { trigger, state, style, transition, animate } from '@angular/animations';

export const Animations = [
  trigger('branchState', [
    state('0', style({ clipPath: 'circle(0% at 0% 100%)' })),
    state('1', style({ clipPath: 'circle(40% at 0% 100%)' })),
    state('2', style({ clipPath: 'circle(65% at 0% 100%)' })),
    state('3', style({ clipPath: 'circle(90% at 0% 100%)' })),
    state('4', style({ clipPath: 'circle(150% at 0% 100%)' })),
    transition('* => *', animate('1.5s ease-out'))
  ]),

  trigger('bubblePop', [
    transition(':enter', [
      style({ transform: 'translateX(-50%) scale(0.8)', opacity: 0 }),
      animate('0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', style({ transform: 'translateX(-50%) scale(1)', opacity: 1 }))
    ]),
    transition(':leave', [
      animate('0.2s ease-out', style({ opacity: 0, transform: 'translateX(-50%) scale(0.9)' }))
    ])
  ]),

  trigger('dandelionPop', [
    transition(':enter', [
      style({ transform: 'translate(-50%, -50%) scale(0) rotate(-45deg)', opacity: 0 }),
      animate('0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        style({ transform: 'translate(-50%, -50%) scale(1) rotate(0deg)', opacity: 1 }))
    ])
  ])
];
