const fieldData = {}
const vogAPI = axios.create({ baseURL: 'https://api.oscproject.net/twitch' })

function getUserType(badges) {
  if (badges.find((badge) => badge.type === 'broadcaster')) {
    return 'BROADCASTER'
  } else if (badges.find((badge) => badge.type === 'moderator')) {
    return 'MODERATOR'
  } else if (badges.find((badge) => badge.type === 'vip')) {
    return 'VIP'
    // TODO: See name of subscriber badge
    // } else if (badges.find((badge) => badge.type === 'subscriber')) {
    //   return 'SUBSCRIBER'
  } else {
    return 'VIEWER'
  }
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const queue = async.queue(async function (displayName) {
  displayName = displayName.startsWith('@') ? displayName.substring(1) : displayName
  const userName = displayName.toLowerCase()

  const mainContainer = $('.main-container')
  if (mainContainer.length > 0) {
    mainContainer.empty()

    try {
      const { data: avatarUrl } = await vogAPI.get(`/user/avatar/${userName}`)
      const { data: gameName } = await vogAPI.get(`/channel/streamgame/${userName}`)
      const { data: gameBoxArtUrl } = await vogAPI.get(`/game/boxart/${gameName}`)

      const avatarWrapper = $(`<div class="avatar-wrapper"><img src="${avatarUrl}" /></div>`)
      mainContainer.append(avatarWrapper)

      const labelWrapper = $(`<div class="label-wrapper">${displayName}</div>`)
      mainContainer.append(labelWrapper)

      /* ======================================================================================== */

      avatarWrapper.addClass('open')
      labelWrapper.addClass('open')

      await sleep(5000)
      avatarWrapper.addClass('close').removeClass('open')
      labelWrapper.addClass('close').removeClass('open')

      await sleep(200)
      avatarWrapper.html(`<img src="${gameBoxArtUrl}" /><div class="avatar-wrapper"><img src="${avatarUrl}" /></div>`)
      labelWrapper.text(gameName)
      avatarWrapper.addClass('open').removeClass('close')
      labelWrapper.addClass('open').removeClass('close')

      await sleep(5000)
      avatarWrapper.addClass('close').removeClass('open')
      labelWrapper.addClass('close').removeClass('open')

      await sleep(200)
      mainContainer.empty()
    } catch (e) {
      console.log(e.message)
      console.error(e)
    }
  }
})

/* ================================================================================================================== */

window.addEventListener('onWidgetLoad', async function (obj) {
  Object.assign(fieldData, {
    ...obj.detail.fieldData,
    commandPrefix: obj.detail.fieldData.commandPrefix ?? '!so',
    userLevel: (obj.detail.fieldData.userLevel ?? 'BROADCASTER,MODERATOR').split(',').map((ul) => ul.trim())
  })
})

window.addEventListener('onEventReceived', function (obj) {
  const listener = obj.detail.listener
  const event = obj.detail.event

  if (listener === 'message') {
    const badges = event.data.badges
    const [cmd, toUser] = (event.data.text ?? '').trim().split(' ')
    if (cmd === fieldData.commandPrefix && fieldData.userLevel.includes(getUserType(badges))) {
      queue.push(toUser)
    }
  }
})
