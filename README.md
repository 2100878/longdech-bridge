# Bridge Core (@longdech/bridge)

Một thư viện HTTP Client siêu nhẹ, hỗ trợ TypeScript tuyệt đối, tích hợp sẵn các tính năng phân trang, infinite scroll, chống trùng lặp request, quản lý token tự động và kết nối mượt mà với React Query.

## ✨ Tính năng nổi bật

- 🚀 **Type-safe:** Hỗ trợ TypeScript hoàn hảo với Generics, đảm bảo an toàn dữ liệu từ API đến UI.
- 📦 **Request Deduplication:** Tự động loại bỏ các request GET trùng lặp đang chạy đồng thời, tối ưu hiệu năng mạng.
- 🔄 **Smart Token Management:** Tự động làm mới token (Refresh Token) với cơ chế hàng đợi (queue), xử lý triệt để tình trạng race-condition.
- 📄 **Standardized Pagination:** Chuẩn hóa dữ liệu phân trang (List và Infinite) giúp FE dễ dàng xử lý UI.
- 🔌 **React Query Integration:** Tự động tạo các hooks ready-to-use cho việc truy vấn và đột biến dữ liệu.
- 🎯 **Flexible Response Mapping:** Ánh xạ linh hoạt mọi định dạng từ Backend về chuẩn chung của dự án.
- 🧩 **Clean Architecture:** Được xây dựng theo nguyên lý Dependency Injection, dễ dàng bảo trì và mở rộng.

## 📦 Cài đặt

```bash
npm install @longdech/bridge
# hoặc
yarn add @longdech/bridge
# hoặc
pnpm add @longdech/bridge
```

## 🚀 Khởi đầu nhanh

### 1. Khởi tạo HTTP Client

```typescript
import { HttpClient } from "@longdech/bridge"

const httpClient = new HttpClient({
  baseURL: "https://api.example.com",
  timeout: 10000,
})
```

### 2. Định nghĩa Query Keys (Dành cho React Query)

```typescript
import { createQueryKeys } from "@longdech/bridge"

const userKeys = createQueryKeys("users")
// Trả về: { all, lists, list, infinite, details, detail, custom }
```

### 3. Tạo Service

```typescript
import { createServiceProvider } from "@longdech/bridge"

const defineService = createServiceProvider(httpClient)

const userService = defineService<User>("/users", userKeys, {
  mapping: {
    listDataPath: "data.items",
    listTotalPath: "data.total",
    listPagePath: "data.page",
    listLimitPath: "data.limit",
    itemDataPath: "data", // Đường dẫn lấy dữ liệu cho detail/create/update
  },
})
```

### 4. Sử dụng trong React Component

```tsx
function UserList() {
  const { data, isLoading } = userService.hooks.useList({ page: 1 })

  if (isLoading) return <div>Đang tải...</div>

  return (
    <div>
      {data?.data.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  )
}
```

## 🧩 Khái niệm cốt lõi

### HttpClient

Lớp bọc quanh Axios, cung cấp khả năng tự động tiêm token và chống trùng lặp request.

```typescript
// Các request GET giống nhau gọi đồng thời sẽ chỉ gửi 1 request thật sự tới Server
const users = await client.get<User[]>("/users")
```

### Token Manager

Xử lý logic làm mới token. Đảm bảo chỉ có 1 yêu cầu refresh token được thực hiện tại một thời điểm, các request khác sẽ đợi và sử dụng token mới sau khi làm mới thành công.

```typescript
import { TokenManager } from "@longdech/bridge"

const tokenManager = new TokenManager({
  executeRefreshToken: async () => {
    const response = await fetch("/refresh")
    return response.json() // Trả về { accessToken, refreshToken }
  },
  onInvalidRefreshToken: () => {
    // Điều hướng về trang login khi token không còn hiệu lực
  },
})
```

### Response Mapping

"Cây cầu" chuyển đổi cấu trúc dữ liệu Backend bất kỳ về chuẩn duy nhất của dự án.

```typescript
const mapper = new ResponseMapper({
  listDataPath: "data.items",
  listTotalPath: "data.total",
  itemDataPath: "data",

  // Transformers: Xử lý các trường hợp đặc biệt
  transformPage: (page) => page + 1, // Ví dụ: chuyển từ 0-based sang 1-based
  transformCursor: (cursor) => atob(cursor), // Giải mã base64 cursor
})
```

## 📊 Định dạng phản hồi chuẩn

### List Response (Phân trang truyền thống)

```typescript
interface ListResponse<T> {
  data: T[]
  meta: {
    currentPage: number
    perPage: number
    nextPage: number | null
    prevPage: number | null
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}
```

### Infinite Response (Phân trang vô hạn)

```typescript
interface InfiniteResponse<T, C = Cursor> {
  items: T[]
  nextCursor?: C
  previousCursor?: C
}
```

## ⚛️ Tích hợp React Query

Service Provider tự động sinh ra các hooks chuẩn:

```typescript
const { hooks } = userService

// Queries
const { data: list } = hooks.useList({ page: 1 })
const { data: infinite } = hooks.useInfinite()
const { data: user } = hooks.useDetail(123)

// Mutations (Tự động invalidate cache sau khi thành công)
const createMutation = hooks.useCreate()
const updateMutation = hooks.useUpdate()
const deleteMutation = hooks.useDelete()
```

## 🛠️ Hướng dẫn nâng cao

### Tùy biến Mapping cho từng API

Bạn có thể ghi đè cấu hình mapping cho một Service cụ thể:

```typescript
const userService = createService<User>("/users", userKeys, {
  // Cách 1: Cấu hình lại path
  mapping: {
    listDataPath: "results",
    listTotalPath: "count",
  },
  // Cách 2: Tự viết hàm mapping hoàn toàn
  mapListResponse: (payload) => ({
    data: payload.results,
    meta: { ... }
  }),
})
```

### Request Deduplication

Mặc định request GET sẽ được chống trùng lặp dựa trên URL và Params. Bạn có thể tắt tính năng này nếu cần:

```typescript
client.get("/users/1", undefined, { skipDeduplication: true })
```

---

**@longdech/bridge** - Professional Data Infrastructure for React Applications.
