'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth, AppUser } from '../contexts/AuthContext';

export default function UsersPage() {
  const { user, appUser, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else if (appUser?.status !== 'approved') {
        router.push('/pending');
      } else if (appUser?.role !== 'admin') {
        router.push('/');
      }
    }
  }, [user, appUser, authLoading, router]);

  useEffect(() => {
    if (appUser?.role === 'admin') {
      fetchUsers();
    }
  }, [appUser]);

  const fetchUsers = async () => {
    try {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data() as AppUser);
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserStatus = async (uid: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'users', uid), { status });
      setUsers(users.map(u => u.uid === uid ? { ...u, status } : u));
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const updateUserRole = async (uid: string, role: 'admin' | 'user') => {
    try {
      await updateDoc(doc(db, 'users', uid), { role });
      setUsers(users.map(u => u.uid === uid ? { ...u, role } : u));
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ko-KR');
  };

  if (authLoading || loading || !user || !appUser || appUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-500">로딩중...</div>
        </div>
      </div>
    );
  }

  const pendingUsers = users.filter(u => u.status === 'pending');
  const approvedUsers = users.filter(u => u.status === 'approved');
  const rejectedUsers = users.filter(u => u.status === 'rejected');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
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
            <li>
              <a href="/users" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-600 text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                사용자 관리
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                통계
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                설정
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* 메인 컨텐츠 영역 */}
      <div className="lg:ml-64">
        {/* 헤더 */}
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">사용자 관리</h2>
                <p className="text-sm text-gray-500 hidden sm:block">사용자 승인 및 권한 관리</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchUsers}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
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
                <button
                  onClick={logout}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="로그아웃"
                >
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
          {/* 통계 카드 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">승인 대기</p>
                  <p className="text-2xl lg:text-3xl font-bold text-amber-600 mt-1">{pendingUsers.length}</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">승인됨</p>
                  <p className="text-2xl lg:text-3xl font-bold text-green-600 mt-1">{approvedUsers.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">거부됨</p>
                  <p className="text-2xl lg:text-3xl font-bold text-red-600 mt-1">{rejectedUsers.length}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* 승인 대기 사용자 */}
          {pendingUsers.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm mb-6 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-amber-50">
                <h3 className="font-semibold text-amber-800">승인 대기중인 사용자</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {pendingUsers.map((u) => (
                  <div key={u.uid} className="p-4 lg:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt="Profile" className="w-12 h-12 rounded-full" />
                      ) : (
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-medium text-lg">{u.displayName?.charAt(0) || '?'}</span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{u.displayName}</p>
                        <p className="text-sm text-gray-500">{u.email}</p>
                        <p className="text-xs text-gray-400 mt-1">가입: {formatDate(u.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateUserStatus(u.uid, 'approved')}
                        className="flex-1 lg:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => updateUserStatus(u.uid, 'rejected')}
                        className="flex-1 lg:flex-none px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        거부
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 승인된 사용자 */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">승인된 사용자</h3>
            </div>
            {approvedUsers.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                승인된 사용자가 없습니다
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {approvedUsers.map((u) => (
                  <div key={u.uid} className="p-4 lg:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt="Profile" className="w-12 h-12 rounded-full" />
                      ) : (
                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-medium text-lg">{u.displayName?.charAt(0) || '?'}</span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{u.displayName}</p>
                          {u.role === 'admin' && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full">
                              관리자
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{u.email}</p>
                        <p className="text-xs text-gray-400 mt-1">가입: {formatDate(u.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {u.uid !== appUser.uid && (
                        <>
                          {u.role === 'user' ? (
                            <button
                              onClick={() => updateUserRole(u.uid, 'admin')}
                              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                            >
                              관리자 지정
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUserRole(u.uid, 'user')}
                              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                            >
                              관리자 해제
                            </button>
                          )}
                          <button
                            onClick={() => updateUserStatus(u.uid, 'rejected')}
                            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                          >
                            접근 차단
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
