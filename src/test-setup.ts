import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'

// jsdom lacks <dialog> methods.
HTMLDialogElement.prototype.showModal ??= function (this: HTMLDialogElement) {
  this.open = true
}
HTMLDialogElement.prototype.close ??= function (this: HTMLDialogElement) {
  this.open = false
}
