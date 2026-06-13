// Shared DTO types mirroring the ASP.NET Core API contracts.

export interface UserDto {
  id: string
  email: string
  fullName: string
  role: string
  mfaEnabled: boolean
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  accessTokenExpiresUtc: string
  user: UserDto
}

export interface AccountDto {
  id: string
  accountNumber: string
  iban: string
  type: string
  status: string
  currency: string
  balance: number
  availableBalance: number
  displayName: string
}

export interface TransactionDto {
  id: string
  accountId: string
  type: string
  status: string
  amount: number
  currency: string
  balanceAfter: number
  description: string
  category: string
  merchantName?: string
  reference: string
  occurredAtUtc: string
}

export interface InvestmentDto {
  id: string
  type: string
  symbol: string
  name: string
  quantity: number
  averagePrice: number
  currentPrice: number
  marketValue: number
  unrealizedGain: number
}

export interface SpendingCategoryDto {
  category: string
  total: number
}

export interface DashboardDto {
  totalBalance: number
  totalInvestments: number
  totalLoans: number
  creditScore: number
  accounts: AccountDto[]
  recentTransactions: TransactionDto[]
  spending: SpendingCategoryDto[]
  investments: InvestmentDto[]
  unreadNotifications: number
}

export interface AiMessageDto {
  id: string
  role: string
  content: string
  createdAtUtc: string
}

export interface AiConversationDto {
  id: string
  title: string
  language: string
  totalTokens: number
  messages: AiMessageDto[]
}

export interface PagedResult<T> {
  items: T[]
  page: number
  pageSize: number
  totalCount: number
  totalPages: number
}
