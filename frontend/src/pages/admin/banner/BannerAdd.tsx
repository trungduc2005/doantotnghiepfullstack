import React, { useState } from "react";
import { Input, Switch, Button, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { createBanner } from "../../../api/bannerApi";

const BannerAdd = () => {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrlInput, setImageUrlInput] = useState("");

  const {
    setValue,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<{
    title?: string;
    link?: string;
    is_active?: boolean;
  }>({
    defaultValues: { is_active: true },
  });

  const titleValue = watch("title");

  const onSubmit = async (data: any) => {
    try {
      const images: any[] = [];

      if (imageFile) {
        images.push({
          file: imageFile,
          is_active: true,
        });
      } else if (imageUrlInput.trim()) {
        images.push({
          url: imageUrlInput.trim(),
          is_active: true,
        });
      } else {
        message.error("Vui lòng chọn ảnh hoặc nhập URL");
        return;
      }

      const payload = {
        title: data.title,
        link: data.link,
        is_active: data.is_active,
        images,
      };

      await createBanner(payload);
      message.success("Tạo banner thành công!");
      navigate("/admin/banner");
    } catch (error: any) {
      message.error(error.message || "Tạo banner thất bại!");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Thêm Banner</h2>

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
                <p className="text-sm">Kéo thả hoặc chọn ảnh</p>
              </div>
            )}
            <div className="w-full mt-4 space-y-2">
              <Input
                placeholder="Dán URL ảnh (vd: https://picsum.photos/800/400)"
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
              value={titleValue || ""}
              onChange={(e) => setValue("title", e.target.value, { shouldValidate: true })}
              placeholder="Nhập tiêu đề banner"
              size="large"
              status={errors.title ? "error" : undefined}
            />
            {errors.title?.message && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block font-medium mb-1">Link (tùy chọn)</label>
            <Input
              value={watch("link") || ""}
              onChange={(e) => setValue("link", e.target.value)}
              placeholder="https://example.com"
              size="large"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="font-medium">Hiển thị:</label>
            <Switch checked={watch("is_active") ?? true} onChange={(checked) => setValue("is_active", checked)} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button size="large" onClick={() => navigate("/admin/banner")}>
              Huỷ
            </Button>
            <Button type="primary" htmlType="submit" size="large">
              Thêm Banner
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BannerAdd;
