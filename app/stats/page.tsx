'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

interface Recording {
  id: string;
  employeeName: string;
  employeeId: string;
  callType: string;
  duration: number;
  recordedAt: number;
  fileSize: number;
}

interface EmployeeStat {
  employeeId: string;
  employeeName: string;
  totalCalls: number;
  incomingCalls: number;
  outgoingCalls: number;
  totalDuration: number;
  totalSize: number;
}

export default function StatsPage() {
  const { user, appUser, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (appUser?.status !== 'approved') {
        router.push('/pending');
      }
    }
  }, [user, appUser, authLoading, router]);

  useEffect(() => {
    if (appUser?.status === 'approved') {
      fetchRecordings();
    }
  }, [appUser]);

  const fetchRecordings = async () => {
    try {
      const q = query(collection(db, 'recordings'), orderBy('recordedAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Recording[];
      setRecordings(data);
    } catch (error) {
      console.error('Error fetching recordings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}시간 ${mins}분`;
    }
    return `${mins}분 ${secs}초`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  // 직원별 통계 계산
  const employeeStats: EmployeeStat[] = recordings.reduce((acc, r) => {
    const existing = acc.find(e => e.employeeId === r.employeeId);
    if (existing) {
      existing.totalCalls++;
      existing.totalDuration += r.duration || 0;
      existing.totalSize += r.fileSize || 0;
      if (r.callType === 'incoming') existing.incomingCalls++;
      else existing.outgoingCalls++;
    } else {
      acc.push({
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        totalCalls: 1,
        incomingCalls: r.callType === 'incoming' ? 1 : 0,
        outgoingCalls: r.callType === 'outgoing' ? 1 : 0,
        totalDuration: r.duration || 0,
        totalSize: r.fileSize || 0,
      });
    }
    return acc;
  }, [] as EmployeeStat[]);

  // 통계 요약
  const totalCalls = recordings.length;
  const totalIncoming = recordings.filter(r => r.callType === 'incoming').length;
  const totalOutgoing = recordings.filter(r => r.callType === 'outgoing').length;
  const totalDuration = recordings.reduce((acc, r) => acc + (r.duration || 0), 0);
  const totalSize = recordings.reduce((acc, r) => acc + (r.fileSize || 0), 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

  if (authLoading || loading || !user || !appUser || appUser.status !== 'approved') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-500">로딩중...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* 사이드바 */}
      <aside className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span className="text-2xl">📞</span>
            <span>통화녹음 관리</span>
          </h1>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <a href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                대시보드
              </a>
            </li>
            {appUser.role === 'admin' && (
              <li>
                <a href="/users" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  사용자 관리
                </a>
              </li>
            )}
            <li>
              <a href="/stats" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-600 text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                통계
              </a>
            </li>
            <li>
              <a href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                설정
              </a>
            </li>
          </ul>
        </nav>

        {/* 앱 다운로드 버튼 */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
          <a
            href="/jcopcs.apk"
            download
            className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            앱 다운로드
          </a>
        </div>
      </aside>

      {/* 메인 컨텐츠 영역 */}
      <div className="lg:ml-64">
        {/* 헤더 */}
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">통계</h2>
                <p className="text-sm text-gray-500 hidden sm:block">녹음 데이터 분석</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={fetchRecordings} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">새로고침</span>
              </button>

              <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-medium text-gray-700">{appUser.displayName}</p>
                  <p className="text-xs text-gray-500">{appUser.email}</p>
                </div>
                {appUser.photoURL ? (
                  <img src={appUser.photoURL} alt="Profile" className="w-9 h-9 rounded-full" />
                ) : (
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-medium">{appUser.displayName?.charAt(0) || '?'}</span>
                  </div>
                )}
                <button onClick={logout} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="로그아웃">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 본문 */}
        <main className="p-4 lg:p-8">
          {/* 전체 통계 */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">전체 녹음</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{totalCalls}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">수신</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{totalIncoming}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">발신</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{totalOutgoing}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">총 통화시간</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{formatDuration(totalDuration)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">평균 통화시간</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{formatDuration(avgDuration)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">총 용량</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{formatFileSize(totalSize)}</p>
            </div>
          </div>

          {/* 직원별 통계 */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">직원별 통계</h3>
            </div>
            {employeeStats.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                녹음 데이터가 없습니다
              </div>
            ) : (
              <>
                {/* 데스크톱 테이블 */}
                <div className="hidden lg:block">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">직원</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">전체</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">수신</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">발신</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">총 통화시간</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase">용량</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {employeeStats.sort((a, b) => b.totalCalls - a.totalCalls).map((stat) => (
                        <tr key={stat.employeeId} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                <span className="text-indigo-600 font-medium">{stat.employeeName?.charAt(0) || '?'}</span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{stat.employeeName}</p>
                                <p className="text-sm text-gray-500">{stat.employeeId}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center font-semibold text-gray-800">{stat.totalCalls}</td>
                          <td className="px-6 py-4 text-center text-green-600">{stat.incomingCalls}</td>
                          <td className="px-6 py-4 text-center text-blue-600">{stat.outgoingCalls}</td>
                          <td className="px-6 py-4 text-center text-gray-600">{formatDuration(stat.totalDuration)}</td>
                          <td className="px-6 py-4 text-center text-gray-600">{formatFileSize(stat.totalSize)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 모바일 카드 */}
                <div className="lg:hidden divide-y divide-gray-100">
                  {employeeStats.sort((a, b) => b.totalCalls - a.totalCalls).map((stat) => (
                    <div key={stat.employeeId} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">{stat.employeeName?.charAt(0) || '?'}</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{stat.employeeName}</p>
                          <p className="text-sm text-gray-500">{stat.employeeId}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="bg-gray-50 rounded-lg p-2">
                          <p className="text-gray-500">전체</p>
                          <p className="font-semibold">{stat.totalCalls}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-2">
                          <p className="text-gray-500">수신</p>
                          <p className="font-semibold text-green-600">{stat.incomingCalls}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-2">
                          <p className="text-gray-500">발신</p>
                          <p className="font-semibold text-blue-600">{stat.outgoingCalls}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
