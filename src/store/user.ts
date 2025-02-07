import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { UserType, UserUpdateParams } from '@/types/user';
import type { ModelSchema } from '@/types/mongoSchema';
import { setToken } from '@/utils/user';
import { getMyModels } from '@/api/model';
import { formatPrice } from '@/utils/user';
import { getTokenLogin } from '@/api/user';

type State = {
  userInfo: UserType | null;
  initUserInfo: () => Promise<null>;
  setUserInfo: (user: UserType | null, token?: string) => void;
  updateUserInfo: (user: UserUpdateParams) => void;
  myModels: ModelSchema[];
  getMyModels: () => void;
  setMyModels: (data: ModelSchema[]) => void;
};

export const useUserStore = create<State>()(
  devtools(
    immer((set, get) => ({
      userInfo: null,
      async initUserInfo() {
        const res = await getTokenLogin();
        get().setUserInfo(res);
        return null;
      },
      setUserInfo(user: UserType | null, token?: string) {
        set((state) => {
          state.userInfo = user
            ? {
                ...user,
                balance: formatPrice(user.balance)
              }
            : null;
        });
        token && setToken(token);
      },
      updateUserInfo(user: UserUpdateParams) {
        set((state) => {
          if (!state.userInfo) return;
          state.userInfo = {
            ...state.userInfo,
            ...user
          };
        });
      },
      myModels: [],
      getMyModels: () =>
        getMyModels().then((res) => {
          set((state) => {
            state.myModels = res;
          });
          return res;
        }),
      setMyModels(data: ModelSchema[]) {
        set((state) => {
          state.myModels = data;
        });
        return null;
      }
    }))
  )
);
