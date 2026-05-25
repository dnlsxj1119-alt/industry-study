import { Post, Member } from '../../types';
import { cn, getMemberColorClasses, getMemberBgClass, getMemberTextClass } from '../../lib/utils';
import { isSameWeek } from 'date-fns';

interface WeeklyStatusProps {
  posts: Post[];
}

export function WeeklyStatus({ posts }: WeeklyStatusProps) {
  const members: Member[] = ['다연', '유연', '준순'];
  const targetPerMember = 5;
  
  // Filter posts for this week using study_date
  const now = new Date();
  const thisWeekPosts = posts.filter(p => {
    // Fallback to created_at if study_date doesn't exist yet (for safety)
    const dateToUse = p.study_date ? new Date(p.study_date) : new Date(p.created_at);
    return isSameWeek(dateToUse, now, { weekStartsOn: 1 }); // Assuming week starts on Monday
  });

  // Calculate uploads per member
  const uploadsByMember = members.reduce((acc, member) => {
    acc[member] = thisWeekPosts.filter(p => p.author === member).length;
    return acc;
  }, {} as Record<Member, number>);

  return (
    <div className="bg-white rounded-2xl p-5 card-shadow border border-gray-100">
      <h3 className="text-sm font-bold text-gray-900 mb-4">
        이번 주 멤버별 업로드 현황
      </h3>

      <div className="space-y-4">
        {members.map(member => {
          const count = uploadsByMember[member] || 0;
          const isDone = count >= targetPerMember;
          const progressPercentage = Math.min((count / targetPerMember) * 100, 100);
          
          return (
            <div key={member} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={cn("w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] mr-2 border", getMemberColorClasses(member))}>
                    {member[0]}
                  </div>
                  <span className={cn("text-sm font-bold", getMemberTextClass(member))}>{member}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-gray-600">
                    {count} / {targetPerMember}
                  </span>
                  {isDone ? (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">완료</span>
                  ) : null}
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className={cn("h-1.5 rounded-full transition-all duration-500 ease-out", isDone ? 'bg-gray-800' : getMemberBgClass(member))}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
