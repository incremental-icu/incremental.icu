'use client';

import React, { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { authFetch } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import dayjs from "dayjs";
import { useLayout } from "@/hooks/use-layout";
import {
  IconRefresh,
  IconCloudDownload,
  IconFile,
  IconSearch,
} from "@tabler/icons-react";
import { Pagination } from "@/components/dash/pagination";

interface SupabaseFile {
  id: number;
  key: string;
  name: string;
  size: number;
  content_type: string;
  last_modified: string | null;
  etag: string;
  bucket: string;
  synced_at: string | null;
}

interface FileListResponse {
  total: number;
  page: number;
  page_size: number;
  files: SupabaseFile[];
}

function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SupabasePage() {
  const t = useTranslations('SupabasePage');
  const { layout } = useLayout();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [files, setFiles] = useState<SupabaseFile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchName, setSearchName] = useState(searchParams.get("name") || "");

  const fetchFiles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        page_size: String(limit),
      });
      const urlName = searchParams.get("name");
      if (urlName) {
        params.append("name", urlName);
      }
      const response = await authFetch(
        `/api/v1/supabase/files?${params.toString()}`
      );
      if (!response.ok) throw new Error("Failed to fetch files");
      const data: FileListResponse = await response.json();
      setFiles(data.files || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Fetch supabase files error:", err);
      toast.error(t("fetchError"));
    } finally {
      setLoading(false);
    }
  }, [page, limit, searchParams, t]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  const handleSync = async (mode: "incremental" | "full") => {
    setSyncing(true);
    try {
      const response = await authFetch(
        `/api/v1/supabase/sync?mode=${mode}`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error("Sync failed");
      const data = await response.json();
      toast.success(
        t("syncSuccess", {
          total: data.total,
          inserted: data.inserted,
          updated: data.updated,
          deleted: data.deleted,
        })
      );
      setPage(1);
      fetchFiles();
    } catch (err) {
      console.error("Sync error:", err);
      toast.error(t("syncError"));
    } finally {
      setSyncing(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleLimitChange = (newLimit: string) => {
    setLimit(Number(newLimit));
    setPage(1);
  };

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmedName = searchName.trim();
    if (trimmedName) {
      params.set("name", trimmedName);
    } else {
      params.delete("name");
    }
    setPage(1);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className={cn(
      "flex-1 mx-auto bg-slate-50/50 dark:bg-background text-sm transition-all duration-300 p-6",
      layout === "fixed" ? "w-full max-w-7xl" : "w-full max-w-none"
    )}>
      <div className="flex flex-col gap-6 py-4 md:py-6">
        <section>
          {/* 顶部操作栏 */}
          <div className="bg-card dark:bg-muted/20 p-2 rounded-lg border border-border shadow-sm mb-4 flex items-center gap-3 max-[768px]:flex-wrap max-[768px]:p-3">
            <div className="relative flex-1 max-w-xs max-[768px]:max-w-full">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground max-[768px]:left-4 max-[768px]:size-5" size={16} />
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full pl-9 pr-3 py-1.5 border border-border bg-background rounded focus:outline-none focus:ring-1 focus:ring-ring max-[768px]:pl-12 max-[768px]:pr-4 max-[768px]:py-3 max-[768px]:text-base"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSync("incremental")}
              disabled={syncing}
              className="ml-auto gap-2 max-[768px]:min-h-[44px] max-[768px]:min-w-[88px]"
            >
              <IconRefresh className={cn(syncing && "animate-spin")} />
              {syncing ? t("syncing") : t("incrementalSync")}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSync("full")}
              disabled={syncing}
              className="gap-2 max-[768px]:min-h-[44px] max-[768px]:min-w-[88px]"
            >
              <IconCloudDownload className="h-4 w-4" />
              {t("fullSync")}
            </Button>

            <Button
              size="sm"
              onClick={handleSearch}
              disabled={loading}
              className="gap-2 max-[768px]:min-h-[44px] max-[768px]:min-w-[88px]"
            >
              {loading ? <IconRefresh className="animate-spin" /> : <IconSearch />}
              {loading ? t("searching") : t("search")}
            </Button>
          </div>

          {/* 表格 */}
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              {t("loading")}
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <IconFile className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
              <p>{t("noFiles")}</p>
              <p className="text-xs mt-1">{t("noFilesHint")}</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("fileName")}</TableHead>
                      <TableHead>{t("fileKey")}</TableHead>
                      <TableHead className="w-28">{t("fileSize")}</TableHead>
                      <TableHead className="w-36">{t("contentType")}</TableHead>
                      <TableHead className="w-44">{t("lastModified")}</TableHead>
                      <TableHead className="w-44">{t("syncedAt")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {files.map((file) => (
                      <TableRow key={file.id}>
                        <TableCell className="font-medium max-w-48 truncate">
                          {file.name}
                        </TableCell>
                        <TableCell className="max-w-64 truncate text-muted-foreground font-mono text-xs">
                          {file.key}
                        </TableCell>
                        <TableCell>{formatFileSize(file.size)}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {file.content_type || "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {file.last_modified
                            ? dayjs(file.last_modified).format("YYYY-MM-DD HH:mm")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {file.synced_at
                            ? dayjs(file.synced_at).format("YYYY-MM-DD HH:mm")
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* 分页 */}
              <div className="mt-4">
                <Pagination
                  total={total}
                  page={page}
                  limit={limit}
                  onPageChange={handlePageChange}
                  onLimitChange={handleLimitChange}
                />
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
