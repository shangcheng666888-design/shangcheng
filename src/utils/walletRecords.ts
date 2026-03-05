import { formatDateTime } from './datetime'
/** 充值记录 */
export type WalletRechargeRecord = {
  id: string
  createdAt: string // ISO
  orderNo: string
  amount: string
  currency: string
  protocol: string
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'
  actualAmount: string
  address: string
  /** 交易号 */
  transactionNo?: string
}

/** 提现记录 */
export type WalletWithdrawRecord = {
  id: string
  createdAt: string
  orderNo: string
  amount: string
  currency: string
  address: string
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'
}

const RECHARGE_KEY = 'walletRechargeRecords'
const WITHDRAW_KEY = 'walletWithdrawRecords'

export function loadRechargeRecords(): WalletRechargeRecord[] {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(RECHARGE_KEY) : null
    if (!raw) return []
    const parsed = JSON.parse(raw) as WalletRechargeRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function loadWithdrawRecords(): WalletWithdrawRecord[] {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(WITHDRAW_KEY) : null
    if (!raw) return []
    const parsed = JSON.parse(raw) as WalletWithdrawRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveRechargeRecords(list: WalletRechargeRecord[]) {
  try {
    window.localStorage.setItem(RECHARGE_KEY, JSON.stringify(list))
  } catch {}
}

export function saveWithdrawRecords(list: WalletWithdrawRecord[]) {
  try {
    window.localStorage.setItem(WITHDRAW_KEY, JSON.stringify(list))
  } catch {}
}

export function addRechargeRecord(record: Omit<WalletRechargeRecord, 'id' | 'createdAt' | 'orderNo'>): WalletRechargeRecord {
  const list = loadRechargeRecords()
  const id = `recharge_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const createdAt = new Date().toISOString()
  const orderNo = `R${Date.now().toString().slice(-10)}`
  const full: WalletRechargeRecord = { ...record, id, createdAt, orderNo }
  list.unshift(full)
  saveRechargeRecords(list)
  return full
}

export function addWithdrawRecord(record: Omit<WalletWithdrawRecord, 'id' | 'createdAt' | 'orderNo'>): WalletWithdrawRecord {
  const list = loadWithdrawRecords()
  const id = `withdraw_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  const createdAt = new Date().toISOString()
  const orderNo = `W${Date.now().toString().slice(-10)}`
  const full: WalletWithdrawRecord = { ...record, id, createdAt, orderNo }
  list.unshift(full)
  saveWithdrawRecords(list)
  return full
}

export const STATUS_TEXT: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  completed: '已完成',
  failed: '失败',
}

export function formatRecordDate(iso: string): string {
  return formatDateTime(iso)
}
