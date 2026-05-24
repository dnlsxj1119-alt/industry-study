import React from 'react';
import { Lightbulb, Target } from 'lucide-react';

export function DiscussionPanel() {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-primary-50 rounded-2xl p-5 card-shadow border border-indigo-100">
      <div className="flex items-center mb-3">
        <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600 mr-3">
          <Lightbulb className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-indigo-900">이번 주 토론 주제</h3>
      </div>
      
      <p className="text-lg font-bold text-gray-900 mb-4 leading-tight">
        "HBM 이후 다음 병목은 무엇인가?"
      </p>
      
      <div className="space-y-2">
        <div className="flex items-start">
          <Target className="w-4 h-4 text-indigo-400 mt-0.5 mr-2 shrink-0" />
          <span className="text-sm text-gray-700">후공정(패키징) 캐파 부족 현황</span>
        </div>
        <div className="flex items-start">
          <Target className="w-4 h-4 text-indigo-400 mt-0.5 mr-2 shrink-0" />
          <span className="text-sm text-gray-700">전력 인프라 증설 속도</span>
        </div>
        <div className="flex items-start">
          <Target className="w-4 h-4 text-indigo-400 mt-0.5 mr-2 shrink-0" />
          <span className="text-sm text-gray-700">AI 모델의 다음 발전 방향</span>
        </div>
      </div>
      
      <button className="w-full mt-5 py-2 bg-white text-indigo-600 text-sm font-bold rounded-xl border border-indigo-100 hover:bg-indigo-50 transition-colors shadow-sm">
        토론 준비하기
      </button>
    </div>
  );
}
