import axios, { AxiosError } from "axios";

// ================== TYPES ==================
export interface IBanner {
  id: number;
  title: string;
  is_active: boolean;
  link?: string | null;
  images: IBannerImage[];
  created_at: string;
  updated_at: string;
}

export interface IBannerImage {
  id: number;
  banner_id: number;
  image: string;
  image_url: string;
  is_active: boolean;
}

export interface IPaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// ================== CONFIG ==================
const axiosInstance = axios.create({
  baseURL: "http://localhost:8000/api/admin",
  headers: {
    "Content-Type": "application/json",
  },
});

// ================== INTERCEPTOR ==================
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (!token) {
    console.warn("Chưa có token! Vui lòng login.");
  } else {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error("401: Token hết hạn hoặc không hợp lệ!");
      localStorage.removeItem("access_token");
      // window.location.href = "/login"; // Tùy chọn: redirect login
    }
    return Promise.reject(error);
  }
);

// ================== HELPERS ==================
const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;

const normalizeImageUrl = (url: string): string => {
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;

  // Strip domain and leading /storage/ so backend stores clean relative path
  const withoutOrigin = trimmed.replace(/^https?:\/\/[^/]+/i, "");
  return withoutOrigin.replace(/^\/?storage\//i, "");
};

const pickSingleImage = (images: any[] | undefined | null) => {
  if (!Array.isArray(images) || images.length === 0) return null;

  const fileImage = images.find((img) => img?.file instanceof File);
  const urlImage = images.find((img) => img?.url);
  const chosen = fileImage || urlImage;

  if (!chosen) return null;

  if (chosen.file && chosen.file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Chi chon 1 anh, toi da 8MB.");
  }

  return {
    file: chosen.file as File | undefined,
    url: chosen.url ? normalizeImageUrl(String(chosen.url)) : undefined,
    is_active: Boolean(chosen.is_active ?? true),
  };
};

const appendSingleImage = (formData: FormData, image: { file?: File; url?: string; is_active: boolean }) => {
  if (image.file) {
    formData.append("images[0][file]", image.file);
  }
  if (image.url) {
    formData.append("images[0][url]", image.url);
  }
  formData.append("images[0][is_active]", image.is_active ? "1" : "0");
};

// ================== SERVICES ==================
export const getAllBanners = async (
  page: number = 1,
  perPage: number = 10,
  keyword?: string
): Promise<IPaginatedResponse<IBanner>> => {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("per_page", String(perPage));
  if (keyword) params.set("keyword", keyword);

  const res = await axiosInstance.get(`/banners?${params.toString()}`);
  return res.data;
};

export const getBannerById = async (id: number): Promise<IBanner> => {
  const res = await axiosInstance.get(`/banners/${id}`);
  return res.data.data;
};

// CREATE BANNER - DUNG AXIOS + FORM DATA
export const createBanner = async (payload: any): Promise<IBanner> => {
  const formData = new FormData();

  // Text fields
  formData.append("title", payload.title);
  if (payload.link) formData.append("link", payload.link);
  formData.append("is_active", payload.is_active ? "1" : "0");

  const singleImage = pickSingleImage(payload.images);
  if (!singleImage) {
    throw new Error("Vui long chon 1 anh tu file hoac URL (toi da 8MB).");
  }
  appendSingleImage(formData, singleImage);

  try {
    const res = await axiosInstance.post("/banners", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data.data || res.data;
  } catch (error: any) {
    const errors = error.response?.data?.errors || {};
    const messages = Object.values(errors).flat().join(", ");
    throw new Error(messages || "Tao banner that bai");
  }
};

// UPDATE BANNER - DUNG AXIOS
export const updateBanner = async (
  id: number,
  data: Partial<IBanner>
): Promise<IBanner> => {
  const singleImage = pickSingleImage((data as any).images);

  if (singleImage) {
    const formData = new FormData();
    if (data.title !== undefined) formData.append("title", String(data.title));
    if (data.link !== undefined && data.link !== null) formData.append("link", String(data.link));
    if (data.is_active !== undefined) formData.append("is_active", data.is_active ? "1" : "0");

    appendSingleImage(formData, singleImage);

    const res = await axiosInstance.post(`/banners/${id}?_method=PUT`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data || res.data;
  }

  const res = await axiosInstance.put(`/banners/${id}`, data);
  return res.data.data || res.data;
};


// DELETE BANNER
export const deleteBanner = async (id: number): Promise<void> => {
  await axiosInstance.delete(`/banners/${id}`);
};
