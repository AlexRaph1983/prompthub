'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    VKIDSDK: any
  }
}

export function VKIDButton() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Загружаем VK ID SDK
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js'
    script.async = true
    script.onload = initVKID
    document.head.appendChild(script)

    return () => {
      // Очищаем контейнер при размонтировании
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
      document.head.removeChild(script)
    }
  }, [])

  const initVKID = () => {
    if ('VKIDSDK' in window && containerRef.current) {
      // Проверяем, не рендерились ли уже кнопки
      if (containerRef.current.children.length > 0) {
        return
      }

      const VKID = window.VKIDSDK

      VKID.Config.init({
        app: 54049644,
        redirectUrl: 'https://crazy-beds-hang.loca.lt/api/auth/callback/vk',
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: '', // Заполните нужными доступами по необходимости
      })

      const oAuth = new VKID.OAuthList()

      oAuth.render({
        container: containerRef.current,
        oauthList: [
          'vkid',
          'ok_ru',
          'mail_ru'
        ]
      })
      .on(VKID.WidgetEvents.ERROR, vkidOnError)
      .on(VKID.OAuthListInternalEvents.LOGIN_SUCCESS, function (payload: any) {
        const code = payload.code
        const deviceId = payload.device_id

        VKID.Auth.exchangeCode(code, deviceId)
          .then(vkidOnSuccess)
          .catch(vkidOnError)
      })
    }
  }

  function vkidOnSuccess(data: any) {
    console.log('VK ID Success:', data)
    // Обработка полученного результата
    // Здесь можно перенаправить пользователя или обновить состояние
  }

  function vkidOnError(error: any) {
    console.error('VK ID Error:', error)
    // Обработка ошибки
  }

  return (
    <div ref={containerRef} className="vk-id-button flex justify-center">
      {/* VK ID кнопка будет отрендерена здесь */}
    </div>
  )
}
