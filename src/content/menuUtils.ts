import React from 'react'
import ReactDOM from 'react-dom/client'
import { toast } from 'sonner'
import { MENU_ITEMS_CONFIG } from './menuConfig'
import { getLocalizedLabel, S_MENU_ITEM_LABELS } from './localization'
import {
  handleCopyMarkdown,
  handleDownloadMarkdown,
  handleCopyImage,
  handleDownloadImage,
} from './actions'
import { GEMINI_SELECTORS } from './selectors'

export interface AddMenuItemsOptions {
  contentSelectorForActions?: string
  closeMenuCallback?: () => void
  isMultiSelectActive?: boolean
  toggleMultiSelectMode?: () => void
}

export function addCustomMenuItems(
  menuPanel: HTMLElement,
  answerBlockRoot: HTMLElement,
  options: AddMenuItemsOptions = {}
) {
  const {
    contentSelectorForActions,
    closeMenuCallback,
    isMultiSelectActive = false,
    toggleMultiSelectMode = () => {},
  } = options

  if (menuPanel.querySelector('.gemini-enhancer-custom-item')) {
    console.log(
      'Gemini Export Enhancer: Custom items already exist in this menu panel. Skipping injection.'
    )
    return
  }

  console.log(
    'Gemini Export Enhancer: Adding custom menu items to panel:',
    menuPanel,
    'associated with block:',
    answerBlockRoot,
    'selector override:',
    contentSelectorForActions
  )

  const pageLang = document.documentElement.lang || 'en'

  type ActionHandlerKey = Exclude<
    keyof typeof S_MENU_ITEM_LABELS,
    'selectMultipleMessages' | 'cancelSelection'
  >

  const actionHandlers: {
    [K in ActionHandlerKey]: (
      blockRoot: HTMLElement,
      contentSelector?: string
    ) => Promise<void>
  } = {
    copyImage: handleCopyImage,
    downloadImage: handleDownloadImage,
    copyMarkdown: handleCopyMarkdown,
    downloadMarkdown: handleDownloadMarkdown,
  }

  const originalFirstChild = menuPanel.firstChild

  MENU_ITEMS_CONFIG.forEach((itemConfig) => {
    const button = document.createElement('button')
    button.setAttribute('role', 'menuitem')
    button.classList.add('gemini-enhancer-custom-item')

    button.style.display = 'flex'
    button.style.alignItems = 'center'
    button.style.width = '100%'
    button.style.padding = '0px 16px'
    button.style.height = '48px'
    button.style.textAlign = 'left'
    button.style.border = 'none'
    button.style.background = 'none'
    button.style.cursor = 'pointer'
    button.style.fontSize = '14px'
    button.style.fontFamily = 'inherit'

    const nativeMenuButton = menuPanel.querySelector('button[mat-menu-item]')
    const isDarkMode =
      document.documentElement.getAttribute('dark') === 'true' ||
      document.documentElement.classList.contains('dark') ||
      (window.getComputedStyle(document.body).backgroundColor &&
        parseInt(
          window.getComputedStyle(document.body).backgroundColor.split('(')[1]
        ) < 128)

    let itemTextColor: string
    let itemIconColor: string

    if (isDarkMode) {
      itemTextColor = 'rgb(232, 234, 237)'
      itemIconColor = 'rgb(232, 234, 237)'
    } else {
      itemTextColor = nativeMenuButton
        ? getComputedStyle(nativeMenuButton).color
        : 'rgb(32, 33, 36)'
      itemIconColor = 'rgb(32, 33, 36)'
    }
    button.style.color = itemTextColor

    const lightModeHoverBg = 'rgba(0, 0, 0, 0.04)'
    const darkModeHoverBg = 'rgba(255, 255, 255, 0.1)'
    button.onmouseenter = () => {
      button.style.backgroundColor = isDarkMode ? darkModeHoverBg : lightModeHoverBg
    }
    button.onmouseleave = () => {
      button.style.backgroundColor = 'transparent'
    }

    const iconContainer = document.createElement('span')
    iconContainer.style.marginRight = '16px'
    iconContainer.style.display = 'flex'
    iconContainer.style.alignItems = 'center'
    const iconRoot = ReactDOM.createRoot(iconContainer)
    iconRoot.render(
      React.createElement(itemConfig.icon, {
        style: { width: '20px', height: '20px', color: itemIconColor },
      })
    )
    button.appendChild(iconContainer)

    const textSpan = document.createElement('span')
    let label: string
    if (itemConfig.id === 'selectMultipleMessages') {
      const labelKey = isMultiSelectActive ? 'cancelSelection' : 'selectMultipleMessages'
      label = getLocalizedLabel(labelKey as keyof typeof S_MENU_ITEM_LABELS, pageLang)
    } else {
      label = getLocalizedLabel(itemConfig.id as keyof typeof S_MENU_ITEM_LABELS, pageLang)
    }
    textSpan.textContent = label
    const nativeMenuItemText = menuPanel.querySelector(
      'button[mat-menu-item] span.mat-mdc-menu-item-text'
    )
    if (nativeMenuItemText) {
      textSpan.style.fontWeight = getComputedStyle(
        nativeMenuItemText as HTMLElement
      ).fontWeight
    } else {
      textSpan.style.fontWeight = '500'
    }
    button.appendChild(textSpan)

    button.onclick = async (e) => {
      e.stopPropagation()
      e.preventDefault()

      if (itemConfig.id === 'selectMultipleMessages') {
        toggleMultiSelectMode()
        toast.info(`多选模式已${isMultiSelectActive ? '开启' : '关闭'}`)
        if (closeMenuCallback) {
          setTimeout(closeMenuCallback, 100)
        } else {
          setTimeout(() => {
            const nativeMenuPanelToClose = document.querySelector(
              GEMINI_SELECTORS.shareMenu.menuPanel
            ) as HTMLElement
            if (
              nativeMenuPanelToClose &&
              nativeMenuPanelToClose === menuPanel &&
              nativeMenuPanelToClose.offsetParent !== null
            ) {
              try {
                const cdkBackdrop = document.querySelector('.cdk-overlay-backdrop')
                if (cdkBackdrop && cdkBackdrop instanceof HTMLElement) {
                  ;(cdkBackdrop as HTMLElement).click()
                  return
                }
                document.body.click()
              } catch (closeError) {
                console.error('Error attempting to close native menu panel:', closeError)
              }
            }
          }, 100)
        }
      } else {
        const actionKey = itemConfig.id as ActionHandlerKey
        const actionToPerform = actionHandlers[actionKey]
        if (!actionToPerform) {
          console.error(
            `Gemini Export Enhancer: No action handler found for ID (this should not happen): ${itemConfig.id}`
          )
          toast.error('操作失败', {
            description: `内部错误：未找到操作 ${itemConfig.id} 的处理器。`,
          })
          return
        }
        const currentAnswerBlockRoot = answerBlockRoot
        if (!currentAnswerBlockRoot) {
          console.error(
            'Gemini Export Enhancer: Cannot perform action, associated answer block is missing.'
          )
          toast.error('操作失败', { description: '无法关联到对应的回答块。' })
          return
        }
        try {
          await actionToPerform(currentAnswerBlockRoot, contentSelectorForActions)
        } catch (error) {
          console.error(`Gemini Export Enhancer: Error executing ${itemConfig.id}:`, error)
          toast.error('操作失败', { description: '执行操作时发生未知错误。' })
        }

        if (closeMenuCallback) {
          setTimeout(closeMenuCallback, 100)
        } else {
          setTimeout(() => {
            const nativeMenuPanelToClose = document.querySelector(
              GEMINI_SELECTORS.shareMenu.menuPanel
            ) as HTMLElement
            if (
              nativeMenuPanelToClose &&
              nativeMenuPanelToClose === menuPanel &&
              nativeMenuPanelToClose.offsetParent !== null
            ) {
              try {
                const cdkBackdrop = document.querySelector('.cdk-overlay-backdrop')
                if (cdkBackdrop && cdkBackdrop instanceof HTMLElement) {
                  ;(cdkBackdrop as HTMLElement).click()
                  return
                }
                document.body.click()
              } catch (closeError) {
                console.error('Error attempting to close native menu panel:', closeError)
              }
            }
          }, 100)
        }
      }
    }

    menuPanel.prepend(button)
  })

  const customItems = menuPanel.querySelectorAll('.gemini-enhancer-custom-item')
  const lastPrependedItem = customItems[customItems.length - 1]
  if (lastPrependedItem && lastPrependedItem.nextSibling) {
    if (
      !(
        lastPrependedItem.nextSibling instanceof HTMLElement &&
        lastPrependedItem.nextSibling.tagName.toLowerCase() === 'mat-divider'
      )
    ) {
      const newDivider = document.createElement('mat-divider')
      newDivider.setAttribute('role', 'separator')
      newDivider.style.borderTop = '1px solid rgba(0,0,0,0.12)'
      newDivider.style.margin = '8px 0'
      menuPanel.insertBefore(newDivider, lastPrependedItem.nextSibling)
    }
  } else if (lastPrependedItem && !lastPrependedItem.nextSibling && originalFirstChild) {
    const newDivider = document.createElement('mat-divider')
    newDivider.setAttribute('role', 'separator')
    newDivider.style.borderTop = '1px solid rgba(0,0,0,0.12)'
    newDivider.style.margin = '8px 0'
    menuPanel.appendChild(newDivider)
  }
}
