import React from 'react';
import { Member } from '../types';
import { getMemberColorClasses, getMemberTextClass } from '../lib/utils';
import { cn } from '../lib/utils';

interface MemberSelectProps {
  onSelect: (member: Member) => void;
}

export function MemberSelect({ onSelect }: MemberSelectProps) {
  const members: Member[] = ['다연', '유연', '준순'];

  return (
    <div className="fixed inset-0 bg-gray-50 flex items-center justify-center p-4 z-[100]">
      <div className="glass-panel p-8 md:p-12 rounded-3xl max-w-md w-full text-center card-shadow relative overflow-hidden">
        {/* Decorative background shapes */}
        <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-primary-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-40 h-40 bg-indigo-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            Welcome 👋
          </h1>
          <p className="text-gray-500 mb-8">
            산업 스터디 보드에 오신 것을 환영합니다.<br/>참여할 멤버를 선택해주세요.
          </p>

          <div className="space-y-4">
            {members.map((member) => (
              <button
                key={member}
                onClick={() => onSelect(member)}
                className="w-full group flex items-center p-4 bg-white rounded-2xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-all duration-300 card-shadow"
              >
                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform border", getMemberColorClasses(member))}>
                  {member[0]}
                </div>
                <div className="ml-4 flex-1 text-left">
                  <span className={cn("block text-lg font-bold", getMemberTextClass(member))}>{member}</span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 text-primary-600 transition-opacity">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
