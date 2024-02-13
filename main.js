let decapiAPI = axios.create({ baseURL: 'https://decapi.me/twitch' })

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let queue = async.queue(async (displayName) => {
  const avatarWrapper = $('.avatar-wrapper')
  const labelWrapper = $('.label-wrapper')

  try {
    const username = displayName.toLowerCase()
    const { data: avatarURL } = await decapiAPI.get(`/avatar/${username}`)
    const { data: gameName } = await decapiAPI.get(`/game/${username}`)

    // Set avatar
    const avatarElement = $.parseHTML(`<img src="${avatarURL}" />`)
    avatarWrapper.attr('style', 'animation: avatarOpen 250ms ease forwards;')
    avatarWrapper.append(avatarElement)

    // Set user display name
    const displayNameElement = $.parseHTML(`<div>${displayName}</div>`)
    labelWrapper.attr('style', 'animation: labelOpen 250ms ease forwards;')
    labelWrapper.html(displayNameElement)

    // Await 5 seconds to close label wrapper
    await sleep(5000)

    // Trigger close animation of label to replace label text for game name if game name exists
    if (gameName != null && gameName.trim().length > 0) {
      labelWrapper.attr('style', 'animation: labelClose 250ms ease forwards;')
      await sleep(250)

      // Display game name
      const gameNameElement = $.parseHTML(`<div>${gameName}</div>`)
      labelWrapper.attr('style', 'animation: labelOpen 250ms ease forwards;')
      labelWrapper.html(gameNameElement)

      // Await 5 seconds to close shoutout card
      await sleep(5000)
    }

    // Trigger close animations
    avatarWrapper.attr('style', 'animation: avatarClose 250ms ease forwards;')
    labelWrapper.attr('style', 'animation: labelClose 250ms ease forwards;')
    await sleep(250)
  } catch (e) {
    console.log(e.message)
    console.error(e)
  } finally {
    // Remove items
    avatarWrapper.removeAttr('style').empty()
    labelWrapper.removeAttr('style').empty()
  }
})

/* ================================================================================================================== */

window.addEventListener('onWidgetLoad', async function (obj) {})

window.addEventListener('onEventReceived', function (obj) {
  const detail = obj.detail

  switch (detail.listener) {
    case 'message':
      const data = detail.event.data
      const badges = data.tags.badges
      const message = data.text

      if (message.startsWith('!so') && (badges.includes('broadcaster') || badges.includes('moderator'))) {
        queue.push((message ?? '').replace('!so', '').replace(/\W/g, ''))
      }
      break
  }
})
