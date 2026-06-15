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

    const setUserInfo = (val: any) => {
      if (!val) return
      const info: IUserInfoRes = {
        userId: val.userId ?? val.id ?? -1,
        username: val.username ?? '',
        nickname: val.nickname ?? val.username ?? '',
        avatar: val.avatar || val.avatarUrl || DEFAULT_AVATAR,
        role: val.role,
        roles: val.roles,
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
