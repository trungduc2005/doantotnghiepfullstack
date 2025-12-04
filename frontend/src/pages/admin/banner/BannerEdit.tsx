import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Input, Switch, Button, message } from "antd";
import { useForm } from "react-hook-form";
import { IBanner, IBannerImage, getBannerById, updateBanner } from "../../../api/bannerApi";

const BannerEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const {
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<IBanner>({
    defaultValues: { title: "", link: "", is_active: true },
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");

  useEffect(() => {
    const fetchBanner = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getBannerById(Number(id));
        reset({
          title: data.title,
          link: data.link || "",
          is_active: data.is_active,
          images: data.images,
          id: data.id,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
        if (data.images?.length > 0) {
          setImageUrlInput(data.images[0].image_url || data.images[0].image);
        }
      } catch (error) {
        console.error(error);
        message.error("Không lấy được dữ liệu banner");
      } finally {
        setLoading(false);
      }
    };
    fetchBanner();
  }, [id, reset]);

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("image", file);

    const token = localStorage.getItem("access_token");
    const headers: HeadersInit = token
      ? {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        }
      : { Accept: "application/json" };

    const res = await fetch("http://localhost:8000/api/admin/upload", {
      method: "POST",
      headers,
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Upload ảnh thất bại");
    }
    const data = await res.json();
    return data.url;
  };

  const onSubmit = async (formData: IBanner) => {
    try {
      const images: Partial<IBannerImage & { url: string }>[] = [];
      const hasNewImage = Boolean(imageFile || imageUrlInput.trim());

      // Chỉ chọn 1 trong 2: ưu tiên file, nếu không có file thì dùng URL
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        images.push({ url: uploadedUrl, is_active: true });
      } else if (imageUrlInput.trim()) {
        images.push({ url: imageUrlInput.trim(), is_active: true });
      }

      const payload: Partial<IBanner> = {
        title: formData.title,
        link: formData.link || undefined,
        is_active: formData.is_active,
      };

      // Chỉ gửi images nếu có ảnh mới
      if (hasNewImage && images.length > 0) {
        payload.images = images as IBannerImage[];
      }

      await updateBanner(Number(id), payload);
      message.success("Cập nhật banner thành công!");
      navigate("/admin/banner");
    } catch (error) {
      console.error(error);
      message.error("Cập nhật thất bại!");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Chỉnh sửa Banner</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Khối upload/preview */}
        <div className="lg:col-span-1">
          <div className="border border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center h-full bg-gray-50">
            {(imageFile || imageUrlInput) ? (
              <img
                src={imageFile ? URL.createObjectURL(imageFile) : imageUrlInput}
                alt="Preview"
                className="w-full h-48 object-cover rounded-md shadow-sm"
              />
            ) : (
              <div className="text-center text-gray-500">
                <p className="font-medium mb-1">Ảnh banner (1 ảnh)</p>
                <p className="text-sm">Kéo thả hoặc chọn ảnh, tối đa ~5MB</p>
              </div>
            )}
            <div className="w-full mt-4 space-y-2">
              <Input
                placeholder="Dán URL ảnh"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file && file.size > 8 * 1024 * 1024) {
                    message.error("Chỉ chọn 1 ảnh; tối đa 8MB.");
                    setImageFile(null);
                    e.target.value = "";
                    return;
                  }
                  setImageFile(file);
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-gray-500 text-center">
                Chỉ chọn 1 ảnh; tối đa 8MB. Ảnh sẽ được lưu vào storage/img/product.
              </p>
            </div>
          </div>
        </div>

        {/* Khối form thông tin */}
        <div className="lg:col-span-2 space-y-4">
          <div>
            <label className="block font-medium mb-1">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <Input
              value={watch("title") || ""}
              onChange={(e) => setValue("title", e.target.value, { shouldDirty: true })}
              placeholder="Nhập tiêu đề banner"
              size="large"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Link (tùy chọn)</label>
            <Input
              value={watch("link") || ""}
              onChange={(e) => setValue("link", e.target.value, { shouldDirty: true })}
              placeholder="https://example.com"
              size="large"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="font-medium">Hiển thị:</label>
            <Switch checked={watch("is_active")} onChange={(checked) => setValue("is_active", checked)} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button size="large" onClick={() => navigate("/admin/banner")}>
              Huỷ
            </Button>
            <Button type="primary" htmlType="submit" size="large" loading={isSubmitting}>
              Cập nhật
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BannerEdit;
