import React, { useEffect, useState } from "react";
import { Table, Button, Image, Tag, Popconfirm, message, Input, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { deleteBanner, getAllBanners, IBanner } from "../../../api/bannerApi";

const BannerList = () => {
  const [banners, setBanners] = useState<IBanner[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState("");
  const navigate = useNavigate();

  const fetchBanners = async (pageParam = page, perPageParam = perPage, keywordParam = keyword) => {
    try {
      setLoading(true);
      const res = await getAllBanners(pageParam, perPageParam, keywordParam || undefined);
      setBanners(res.data || []);
      setTotal(res.meta?.total || 0);
      setPage(res.meta?.current_page || pageParam);
      setPerPage(res.meta?.per_page || perPageParam);
    } catch (error) {
      message.error("Không thể lấy danh sách banner");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: number) => {
    try {
      await deleteBanner(id);
      message.success("Xoá banner thành công");
      fetchBanners();
    } catch {
      message.error("Xoá thất bại");
    }
  };

  const columns = [
    {
      title: "Ảnh",
      width: 120,
      render: (record: IBanner) => {
        const img = record.images?.[0];
        const rawUrl = img?.image_url || img?.image;

        if (!rawUrl) {
          return <Image width={100} src="https://via.placeholder.com/100" alt="No image" />;
        }

        const fullUrl = rawUrl.startsWith("http")
          ? rawUrl
          : `http://localhost:8000${rawUrl.startsWith("/") ? "" : "/"}${rawUrl}`;

        return (
          <Image
            width={100}
            height={60}
            src={fullUrl}
            fallback="https://via.placeholder.com/100"
            preview={{ src: fullUrl }}
            style={{ objectFit: "cover", borderRadius: 6 }}
            alt={record.title}
          />
        );
      },
    },
    {
      title: "Tiêu đề",
      dataIndex: "title",
      ellipsis: true,
    },
    {
      title: "Link",
      dataIndex: "link",
      render: (text: string) =>
        text ? (
          <a href={text} target="_blank" rel="noopener noreferrer" className="text-blue-600">
            {text.length > 50 ? `${text.substring(0, 50)}...` : text}
          </a>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    {
      title: "Hiển thị",
      dataIndex: "is_active",
      render: (active: boolean) =>
        active ? <Tag color="success">Đang hiển thị</Tag> : <Tag color="error">Ẩn</Tag>,
    },
    {
      title: "Hành động",
      width: 180,
      render: (record: IBanner) => (
        <div className="flex gap-2">
          <Button
            size="small"
            type="primary"
            onClick={() => navigate(`/admin/banner/edit/${record.id}`)}
          >
            Sửa
          </Button>

          <Popconfirm
            title="Bạn có chắc chắn xoá banner này?"
            onConfirm={() => handleDelete(record.id)}
            okText="Xoá"
            cancelText="Huỷ"
          >
            <Button size="small" danger>
              Xoá
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  const handleSearch = () => {
    fetchBanners(1, perPage, keyword.trim());
  };

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <div className="flex flex-col gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Danh sách Banner</h2>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <Space.Compact className="w-full md:w-2/3">
            <Input
              placeholder="Tìm kiếm banner..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
              size="large"
            />
            <Button type="primary" onClick={handleSearch} size="large">
              Search
            </Button>
          </Space.Compact>
          <Button
            type="primary"
            size="large"
            className="w-full md:w-auto h-[40px]"
            onClick={() => navigate("/admin/banner/add")}
          >
            + Thêm Banner Mới
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={banners}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize: perPage,
          total,
          onChange: (p, ps) => fetchBanners(p, ps),
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (t) => `Tổng ${t} banner`,
        }}
        scroll={{ x: 800 }}
      />
    </div>
  );
};

export default BannerList;
