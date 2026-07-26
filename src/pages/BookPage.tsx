import React, { useState } from 'react';
import { Book, BookStatus, Member } from '../types';
import { MEMBERS } from '../constants/members';
import { BookCard } from '../components/Book/BookCard';
import { cn } from '../lib/utils';

interface BookPageProps {
  books: Book[];
  currentMember: Member;
  onBookClick: (book: Book) => void;
  onEdit: (book: Book) => void;
}

const STATUS_TABS: (BookStatus | '전체')[] = ['전체', '읽고 싶은 책', '읽는 중', '완독'];

export function BookPage({ books, currentMember, onBookClick, onEdit }: BookPageProps) {
  const [selectedMember, setSelectedMember] = useState<Member | '전체'>('전체');
  const [selectedStatus, setSelectedStatus] = useState<BookStatus | '전체'>('전체');

  const filteredBooks = books.filter(book => {
    const memberMatch = selectedMember === '전체' || book.member === selectedMember;
    const statusMatch = selectedStatus === '전체' || book.status === selectedStatus;
    return memberMatch && statusMatch;
  });

  return (
    <div className="flex-1 min-w-0">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2">
          {(['전체', ...MEMBERS] as const).map(member => (
            <button
              key={member}
              onClick={() => setSelectedMember(member)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                selectedMember === member
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              )}
            >
              {member}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map(status => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap",
                selectedStatus === status
                  ? "bg-gray-900 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {filteredBooks.map(book => (
          <BookCard
            key={book.id}
            book={book}
            currentMember={currentMember}
            onClick={() => onBookClick(book)}
            onEdit={onEdit}
          />
        ))}
        {filteredBooks.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-gray-100 border-dashed">
            <p className="text-gray-500">아직 등록된 책이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
