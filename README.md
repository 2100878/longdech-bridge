# Bridge Core (@longdech/bridge)

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React Query](https://img.shields.io/badge/-React%20Query-FF4154?style=for-the-badge&logo=react-query&logoColor=white)](https://tanstack.com/query/latest)
[![Axios](https://img.shields.io/badge/-Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com/)

**Bridge Core** là một hạ tầng dữ liệu (Data Infrastructure) siêu nhẹ, được thiết kế theo tư duy "Cái cầu" — giúp chuẩn hóa và kết nối mọi cấu trúc dữ liệu từ Backend về giao diện người dùng (UI) một cách đồng nhất, an toàn (Type-safe) và hiệu năng cao.

> [!NOTE]
> Thư viện này không chỉ là một Axios Wrapper đơn thuần. Nó cung cấp một giải pháp toàn diện cho Data Normalization, Token Management và Network Optimization cho các ứng dụng React hiện đại.

---

## ✨ Điểm khác biệt mang tính "Senior"

Trong phát triển phần mềm thực tế, dữ liệu từ API thường "hỗn loạn" hoặc không thống nhất. `bridge-core` giải quyết triệt để các vấn đề sau:

- 🛡️ **Zero-Race-Condition Token Management**: Khi Access Token hết hạn, hàng loạt request gọi đồng thời sẽ bị "treo" vào hàng đợi (Queue). Chỉ *duy nhất* 1 request refresh token được thực hiện. Sau khi thành công, toàn bộ hàng đợi sẽ được tiếp tục chạy với token mới.
- 🚀 **Deterministic Request Deduplication**: Tự động nhận diện và triệt tiêu các request GET trùng lặp (dựa trên URL và Params) đang chạy đồng thời, giúp tiết kiệm băng thông và tài nguyên CPU đáng kể.
- 🎯 **Advanced Data Mapping**: Sử dụng `itemDataPath` và `PathResolver` để bóc tách dữ liệu từ bất kỳ cấu trúc API nào (ngay cả khi bọc trong nhiều lớp object) mà không làm ô nhiễm code UI.
- 🔌 **Ready-to-use React Query Hooks**: Tự động sinh ra các CRUD hooks chuẩn chỉnh, tích hợp sẵn logic `invalidateQueries` để đảm bảo UI luôn hiển thị dữ liệu mới nhất.

---

## 📦 Cài đặt

```bash
pnpm add @longdech/bridge
# Hoặc npm/yarn
npm install @longdech/bridge
```

---

## 🚀 Lộ trình triển khai (Quick Start)

### 1. Khởi tạo Cơ sở hạ tầng (Infrastructure)

Thiết lập `HttpClient` với các chính sách về xác thực, ngôn ngữ và xử lý lỗi:

```typescript
import { HttpClient, TokenManager } from "@longdech/bridge";

const tokenManager = new TokenManager({
  getAccessToken: () => localStorage.getItem("access_token"),
  executeRefreshToken: async () => {
    // Logic gọi API refresh thực tế
    const res = await fetch("/api/auth/refresh");
    const data = await res.json();
    return { accessToken: data.token, refreshToken: data.refresh };
  },
  onRefreshTokenSuccess: (tokens) => {
    localStorage.setItem("access_token", tokens.accessToken);
  }
});

const client = new HttpClient({
  baseURL: "https://api.yourdomain.com/v1",
  tokenManager, // Tự động inject Authorization header
  enableDeduplication: true, // Chống trùng lặp request GET
  attachLocale: (req) => {
    req.headers["Accept-Language"] = "vi-VN";
  }
});
```

### 2. Định nghĩa Dịch vụ (Service Layer)

Sử dụng `createServiceProvider` để tạo ra một "Bridge" cho từng Resource:

```typescript
import { createServiceProvider, createQueryKeys } from "@longdech/bridge";

interface Post { 
  id: number; 
  title: string; 
  content: string; 
}

const defineService = createServiceProvider(client);
const postKeys = createQueryKeys("posts");

export const postService = defineService<Post>("/posts", postKeys, {
  mapping: {
    // Chuẩn hóa đường dẫn lấy dữ liệu cho List và Item
    listDataPath: "data.items", 
    listTotalPath: "data.total", 
    itemDataPath: "data.content", // Ví dụ API trả về { status: true, data: { content: { ... } } }
  }
});
```

### 3. Sử dụng trong UI (React Component)

Tận dụng bộ hooks siêu tốc được sinh ra tự động:

```tsx
export function PostListView() {
  const { data, isLoading } = postService.hooks.useList({ page: 1 });
  const deleteMutation = postService.hooks.useDelete();

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {data?.data.map(post => (
        <div key={post.id}>
          <h3>{post.title}</h3>
          <button onClick={() => deleteMutation.mutate(post.id)}>Xóa</button>
        </div>
      ))}
    </div>
  );
}
```

---

## 🧩 Các thành phần chuyên sâu

### 1. Quản lý Token thông minh (TokenManager)
Đảm bảo trải nghiệm người dùng không bị gián đoạn ngay cả khi token hết hạn giữa chừng. Thư viện xử lý việc đợi (wait) và tiếp tục (resume) request một cách tự động.

### 2. Hệ thống Mapping linh hoạt (ResponseMapper)
Bạn không cần phải viết `.then(res => res.data.items)` ở khắp mọi nơi. Hãy cấu hình mapping một lần ở tầng Service:

```typescript
mapping: {
  // Có thể dùng string path
  listDataPath: "result.records",
  // Hoặc dùng hàm resolver cho logic phức tạp
  listTotalPath: (raw) => raw.meta.pagination.total_count,
}
```

### 3. Chống trùng lặp Request (Deduplication)
Bảo vệ Server khỏi tình trạng "Spamming" request từ FE (do user click nhanh hoặc do Re-render của React).

---

## 🛠️ Cấu hình chuẩn hóa (Best Practices)

Để đạt hiệu quả cao nhất của một Senior Developer, hãy tổ chức thư mục như sau:

```text
src/
  ├── api/
  │   ├── client.ts       # HttpClient & TokenManager config
  │   └── services/
  │       ├── user.ts     # postService, userService...
  │       └── product.ts
  └── hooks/
      └── queries/        # Export trực tiếp hooks từ service
```

---

## 📊 Định dạng dữ liệu chuẩn (Outputs)

Mọi API sau khi đi qua `bridge` đều trả về một interface duy nhất:

| Method | Response | Description |
| :--- | :--- | :--- |
| `useList` | `ListResponse<T>` | Gồm `data: T[]` và `meta` (pagination info) |
| `useInfinite` | `InfiniteResponse<T>` | Gồm `items: T[]` và `nextCursor/prevCursor` |
| `useDetail` | `T` | Dữ liệu thực tế của item sau khi bóc tách |

---

> [!TIP]
> **@longdech/bridge** là sự kết hợp tinh hoa giữa sức mạnh của Axios và sự tiện lợi của React Query, được tinh chỉnh để phục vụ các dự án quy mô lớn.

**Author:** [longdech](https://github.com/longdech)
**License:** ISC
