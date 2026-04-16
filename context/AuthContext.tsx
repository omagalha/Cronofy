import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

type AuthProviderProps = {
  children: ReactNode;
};

type AuthUser = {
  id: string;
  name: string;
  email?: string | null;
  provider: 'google' | 'apple' | 'email';
};

type AuthContextData = {
  user: AuthUser | null;
  isAuthLoaded: boolean;
  isAuthenticated: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  createAccount: (name: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const STORAGE_KEYS = {
  USER: '@cronofy/auth_user_v1',
};

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);

  useEffect(() => {
    async function hydrateAuth() {
      try {
        const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);

        if (storedUser) {
          const parsed = JSON.parse(storedUser) as AuthUser;
          setUser(parsed);
        }
      } catch (error) {
        console.warn('Erro ao carregar auth', error);
        setUser(null);
      } finally {
        setIsAuthLoaded(true);
      }
    }

    hydrateAuth();
  }, []);

  async function persistUser(nextUser: AuthUser | null) {
    if (!nextUser) {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      return;
    }

    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(nextUser));
  }

  async function loginWithGoogle() {
    const fakeUser: AuthUser = {
      id: 'google-user-1',
      name: 'Usuário Google',
      email: 'google@cronofy.app',
      provider: 'google',
    };

    setUser(fakeUser);
    await persistUser(fakeUser);
  }

  async function loginWithApple() {
    const fakeUser: AuthUser = {
      id: 'apple-user-1',
      name: 'Usuário Apple',
      email: 'apple@cronofy.app',
      provider: 'apple',
    };

    setUser(fakeUser);
    await persistUser(fakeUser);
  }

  async function createAccount(name: string, email: string) {
    const fakeUser: AuthUser = {
      id: `email-${Date.now()}`,
      name: name.trim() || 'Novo usuário',
      email: email.trim() || null,
      provider: 'email',
    };

    setUser(fakeUser);
    await persistUser(fakeUser);
  }

  async function logout() {
    setUser(null);
    await persistUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      isAuthLoaded,
      isAuthenticated: Boolean(user),
      loginWithGoogle,
      loginWithApple,
      createAccount,
      logout,
    }),
    [user, isAuthLoaded]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }

  return context;
}