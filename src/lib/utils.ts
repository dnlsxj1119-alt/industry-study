import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Member } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getMemberColorClasses(member: string): string {
  switch (member) {
    case '다연': return 'bg-blue-100 text-blue-700 border-blue-200';
    case '유연': return 'bg-purple-100 text-purple-700 border-purple-200';
    case '준순': return 'bg-green-100 text-green-700 border-green-200';
    case '기윤': return 'bg-rose-100 text-rose-700 border-rose-200';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
}

export function getMemberBorderClass(member: string): string {
  switch (member) {
    case '다연': return 'border-blue-200 hover:border-blue-300';
    case '유연': return 'border-purple-200 hover:border-purple-300';
    case '준순': return 'border-green-200 hover:border-green-300';
    case '기윤': return 'border-rose-200 hover:border-rose-300';
    default: return 'border-gray-200';
  }
}

export function getMemberBgClass(member: string): string {
  switch (member) {
    case '다연': return 'bg-blue-500';
    case '유연': return 'bg-purple-500';
    case '준순': return 'bg-green-500';
    case '기윤': return 'bg-rose-500';
    default: return 'bg-gray-500';
  }
}

export function getMemberTextClass(member: string): string {
  switch (member) {
    case '다연': return 'text-blue-700';
    case '유연': return 'text-purple-700';
    case '준순': return 'text-green-700';
    case '기윤': return 'text-rose-700';
    default: return 'text-gray-700';
  }
}
