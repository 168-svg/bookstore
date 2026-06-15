import type { IUserInfoRes } from '@/api/types/login'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUserInfo } from '@/api/auth'

const DEFAULT_AVATAR = '/static/images/default-avatar.png'

const userInfoState: IUserInfoRes = {
  userId: -1,
  username: '',
  nickname: '',
  avatar: DEFAULT_AVATAR,
}

export const useUserStore = defineStore(
  'user',
  () => {
    const userInfo = ref<IUserInfoRes>({ ...userInfoState })

    const setUserInfo = (val: Partial<IUserInfoRes> & Record<string, unknown>) => {
      if (!val)
        return
      const info: IUserInfoRes = {
        userId: (val.userId as number) ?? (val.id as number) ?? -1,
        username: (val.username as string) ?? '',
        nickname: (val.nickname as string) ?? (val.username as string) ?? '',
        avatar: (val.avatar as string) || (val.avatarUrl as string) || DEFAULT_AVATAR,
        role: val.role as string | undefined,
        roles: val.roles as string[] | undefined,
      }
      userInfo.value = info
    }

    const setUserAvatar = (avatar: string) => {
      userInfo.value.avatar = avatar || DEFAULT_AVATAR
    }

    const clearUserInfo = () => {
      userInfo.value = { ...userInfoState }
    }

    const fetchUserInfo = async () => {
      const res = await getUserInfo()
      setUserInfo(res)
      return res
    }

    return {
      userInfo,
      clearUserInfo,
      fetchUserInfo,
      setUserInfo,
      setUserAvatar,
    }
  },
  {
    persist: true,
  },
)
