'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth, AppUser } from '../contexts/AuthContext';
import {
  Home,
  Users,
  BarChart3,
  Settings,
  Menu,
  RefreshCw,
  LogOut,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  Pencil,
  Shield,
  ShieldOff,
  Ban,
  Trash2,
  UserCheck,
  UserX
} from 'lucide-react';

export default function UsersPage() {
  const { user, appUser, loading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [newName, setNewName] = useState('');

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

  const updateUserName = async () => {
    if (!editingUser || !newName.trim()) return;
    try {
      await updateDoc(doc(db, 'users', editingUser.uid), { displayName: newName.trim() });
      setUsers(users.map(u => u.uid === editingUser.uid ? { ...u, displayName: newName.trim() } : u));
      setEditingUser(null);
      setNewName('');
    } catch (error) {
      console.error('Error updating user name:', error);
    }
  };

  const openEditModal = (u: AppUser) => {
    setEditingUser(u);
    setNewName(u.displayName);
  };

  const deleteUser = async (uid: string, displayName: string) => {
    if (!confirm(`정말 "${displayName}" 사용자를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    try {
      await deleteDoc(doc(db, 'users', uid));
      setUsers(users.filter(u => u.uid !== uid));
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('사용자 삭제 중 오류가 발생했습니다.');
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
      {/* 이름 수정 모달 */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">이름 수정</h3>
            <div className="flex items-center gap-3 mb-4">
              {editingUser.photoURL ? (
                <img src={editingUser.photoURL} alt="Profile" className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-600 font-medium text-lg">{editingUser.displayName?.charAt(0) || '?'}</span>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">{editingUser.email}</p>
              </div>
            </div>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              placeholder="새 이름 입력"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setEditingUser(null)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                취소
              </button>
              <button
                onClick={updateUserName}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}

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
                <Home className="w-5 h-5" />
                대시보드
              </a>
            </li>
            <li>
              <a href="/users" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-indigo-600 text-white">
                <Users className="w-5 h-5" />
                사용자 관리
              </a>
            </li>
            <li>
              <a href="/stats" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
                <BarChart3 className="w-5 h-5" />
                통계
              </a>
            </li>
            <li>
              <a href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-300 hover:bg-slate-800 transition-colors">
                <Settings className="w-5 h-5" />
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
            <Download className="w-5 h-5" />
            앱 다운로드
          </a>
        </div>
      </aside>

      {/* 메인 컨텐츠 영역 */}
      <div className="lg:ml-64">
        {/* 헤더 */}
        <header className="sticky top-0 z-30 bg-white shadow-sm">
          <div className="flex items-center justify-between px-3 py-3 lg:px-8 lg:py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h2 className="text-base lg:text-lg font-semibold text-gray-800">사용자 관리</h2>
                <p className="text-xs lg:text-sm text-gray-500 hidden sm:block">사용자 승인 및 권한 관리</p>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
              <button
                onClick={fetchUsers}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-xs lg:text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">새로고침</span>
              </button>

              <div className="flex items-center gap-2 lg:gap-3 pl-2 lg:pl-3 border-l border-gray-200">
                {appUser.photoURL ? (
                  <img src={appUser.photoURL} alt="Profile" className="w-8 h-8 lg:w-9 lg:h-9 rounded-full" />
                ) : (
                  <div className="w-8 h-8 lg:w-9 lg:h-9 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-medium text-sm">{appUser.displayName?.charAt(0) || '?'}</span>
                  </div>
                )}
                <button
                  onClick={logout}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* 본문 */}
        <main className="p-3 lg:p-8">
          {/* 통계 카드 */}
          <div className="grid grid-cols-3 gap-2 lg:gap-4 mb-4 lg:mb-6">
            <div className="bg-white rounded-xl p-3 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-500">승인대기</p>
                  <p className="text-xl lg:text-3xl font-bold text-amber-600 mt-0.5 lg:mt-1">{pendingUsers.length}</p>
                </div>
                <div className="w-9 h-9 lg:w-12 lg:h-12 bg-amber-100 rounded-full flex items-center justify-center">
                  <Clock className="w-4 h-4 lg:w-6 lg:h-6 text-amber-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-500">승인됨</p>
                  <p className="text-xl lg:text-3xl font-bold text-green-600 mt-0.5 lg:mt-1">{approvedUsers.length}</p>
                </div>
                <div className="w-9 h-9 lg:w-12 lg:h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 lg:w-6 lg:h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3 lg:p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-500">거부됨</p>
                  <p className="text-xl lg:text-3xl font-bold text-red-600 mt-0.5 lg:mt-1">{rejectedUsers.length}</p>
                </div>
                <div className="w-9 h-9 lg:w-12 lg:h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <XCircle className="w-4 h-4 lg:w-6 lg:h-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* 승인 대기 사용자 */}
          {pendingUsers.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm mb-4 lg:mb-6 overflow-hidden">
              <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-100 bg-amber-50">
                <h3 className="font-semibold text-amber-800 text-sm lg:text-base">승인 대기중인 사용자</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {pendingUsers.map((u) => (
                  <div key={u.uid} className="p-3 lg:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt="Profile" className="w-10 h-10 lg:w-12 lg:h-12 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">{u.displayName?.charAt(0) || '?'}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm lg:text-base truncate">{u.displayName}</p>
                        <p className="text-xs lg:text-sm text-gray-500 truncate">{u.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">가입: {formatDate(u.createdAt)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 lg:gap-2">
                      <button
                        onClick={() => updateUserStatus(u.uid, 'approved')}
                        className="flex items-center justify-center gap-1 px-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium whitespace-nowrap"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>승인</span>
                      </button>
                      <button
                        onClick={() => updateUserStatus(u.uid, 'rejected')}
                        className="flex items-center justify-center gap-1 px-2 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-xs font-medium whitespace-nowrap"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>거부</span>
                      </button>
                      <button
                        onClick={() => deleteUser(u.uid, u.displayName)}
                        className="flex items-center justify-center gap-1 px-2 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs font-medium whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>삭제</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 승인된 사용자 */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800 text-sm lg:text-base">승인된 사용자</h3>
            </div>
            {approvedUsers.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                승인된 사용자가 없습니다
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {approvedUsers.map((u) => (
                  <div key={u.uid} className="p-3 lg:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt="Profile" className="w-10 h-10 lg:w-12 lg:h-12 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">{u.displayName?.charAt(0) || '?'}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900 text-sm lg:text-base truncate">{u.displayName}</p>
                          {u.role === 'admin' && (
                            <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full whitespace-nowrap">
                              관리자
                            </span>
                          )}
                        </div>
                        <p className="text-xs lg:text-sm text-gray-500 truncate">{u.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">가입: {formatDate(u.createdAt)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 lg:gap-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="flex items-center justify-center gap-1 px-2 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs font-medium whitespace-nowrap"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>수정</span>
                      </button>
                      {u.uid !== appUser.uid && (
                        <>
                          {u.role === 'user' ? (
                            <button
                              onClick={() => updateUserRole(u.uid, 'admin')}
                              className="flex items-center justify-center gap-1 px-2 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors text-xs font-medium whitespace-nowrap"
                            >
                              <Shield className="w-3.5 h-3.5" />
                              <span>관리자</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => updateUserRole(u.uid, 'user')}
                              className="flex items-center justify-center gap-1 px-2 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium whitespace-nowrap"
                            >
                              <ShieldOff className="w-3.5 h-3.5" />
                              <span>해제</span>
                            </button>
                          )}
                          <button
                            onClick={() => updateUserStatus(u.uid, 'rejected')}
                            className="flex items-center justify-center gap-1 px-2 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium whitespace-nowrap"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>차단</span>
                          </button>
                          <button
                            onClick={() => deleteUser(u.uid, u.displayName)}
                            className="flex items-center justify-center gap-1 px-2 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-xs font-medium whitespace-nowrap"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>삭제</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 거부된 사용자 */}
          {rejectedUsers.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm mt-4 lg:mt-6 overflow-hidden">
              <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-100 bg-red-50">
                <h3 className="font-semibold text-red-800 text-sm lg:text-base">거부된 사용자</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {rejectedUsers.map((u) => (
                  <div key={u.uid} className="p-3 lg:p-6">
                    <div className="flex items-center gap-3 mb-3">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt="Profile" className="w-10 h-10 lg:w-12 lg:h-12 rounded-full" />
                      ) : (
                        <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium">{u.displayName?.charAt(0) || '?'}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm lg:text-base truncate">{u.displayName}</p>
                        <p className="text-xs lg:text-sm text-gray-500 truncate">{u.email}</p>
                        <p className="text-xs text-gray-400 mt-0.5">가입: {formatDate(u.createdAt)}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 lg:gap-2">
                      <button
                        onClick={() => updateUserStatus(u.uid, 'approved')}
                        className="flex items-center justify-center gap-1 px-2 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-medium whitespace-nowrap"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>승인</span>
                      </button>
                      <button
                        onClick={() => deleteUser(u.uid, u.displayName)}
                        className="flex items-center justify-center gap-1 px-2 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-xs font-medium whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>삭제</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
