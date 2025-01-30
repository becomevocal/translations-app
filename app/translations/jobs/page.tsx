"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import styled from "styled-components";
import {
  Box,
  Button,
  Flex,
  FlexItem,
  Modal,
  Panel,
  Select,
  Table,
  Text,
  Tooltip,
  ProgressCircle,
  FormGroup,
  OffsetPaginationProps,
  Dropdown,
} from "@bigcommerce/big-design";
import {
  ArrowDropDownIcon,
  ArrowUpwardIcon,
  FileDownloadIcon,
  RedoIcon,
  MoreHorizIcon,
} from "@bigcommerce/big-design-icons";
import { Header, Page } from "@bigcommerce/big-design-patterns";
import { theme as defaultTheme } from "@bigcommerce/big-design-theme";
import { useChannels } from "@/hooks/useChannels";
import ErrorMessage from "@/components/error-message";
import { LoadingScreen } from "@/components/loading-indicator";
import { Suspense } from "react";

type TranslationJob = {
  id: number;
  status: "pending" | "processing" | "completed" | "failed";
  jobType: "import" | "export";
  fileUrl?: string;
  channelId: number;
  locale: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

const StyledPanelContents = styled.div`
  display: block;
  box-sizing: border-box;
  margin-inline: -${defaultTheme.spacing.medium};
  max-width: calc(
    100% + ${defaultTheme.spacing.medium}px +
      ${defaultTheme.spacing.medium}px
  );
  overflow-x: auto;
  @media (min-width: ${defaultTheme.breakpointValues.tablet}) {
    margin-inline: -${defaultTheme.spacing.xLarge};
    max-width: calc(
      100% + ${defaultTheme.spacing.xLarge}px +
        ${defaultTheme.spacing.xLarge}px
    );
  }
`;

function TranslationsJobsContent() {
  const t = useTranslations("translations.jobs");
  const searchParams = useSearchParams();
  const context = searchParams?.get("context");
  const [jobs, setJobs] = useState<TranslationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [selectedLocale, setSelectedLocale] = useState<string>("");
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [isRunningCron, setIsRunningCron] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const {
    channels,
    isLoading: isChannelsLoading,
    error: channelsError,
  } = useChannels(context ?? null);

  // Get available locales for selected channel
  const availableLocales = selectedChannel
    ? channels?.find((c) => c.channel_id === selectedChannel)?.locales || []
    : [];

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/translations/jobs?context=${context}`);
      if (!response.ok) throw new Error(t("errors.fetchJobs"));
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error(t("errors.fetchJobs"), error);
    } finally {
      setIsLoading(false);
    }
  }, [context, t]);

  const handleCreateJob = async (jobType: "import" | "export") => {
    if (!selectedChannel || !selectedLocale) return;

    if (jobType === "import") {
      setShowUploadModal(true);
      return;
    }

    setIsCreatingJob(true);
    try {
      const response = await fetch(
        `/api/translations/jobs?context=${context}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobType,
            channelId: selectedChannel,
            locale: selectedLocale,
          }),
        }
      );

      if (!response.ok) throw new Error(t("errors.createJob"));
      fetchJobs();
      if (jobType === "export") {
        setShowExportModal(false);
      }
      handleRunCron();
    } catch (error) {
      console.error(t("errors.createJob"), error);
    } finally {
      setIsCreatingJob(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsCreatingJob(true);
    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("channelId", selectedChannel!.toString());
      formData.append("locale", selectedLocale);

      // Upload file and create job
      const response = await fetch(
        `/api/translations/jobs?context=${context}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(t("errors.uploadFile"));
      }

      setShowUploadModal(false);
      setSelectedFile(null);
      fetchJobs();
      handleRunCron();
    } catch (error) {
      console.error(t("errors.uploadFile"), error);
    } finally {
      setIsCreatingJob(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRunCron = async () => {
    setIsRunningCron(true);
    try {
      const response = await fetch(
        `/api/translations/cron?context=${context}`,
        {
          method: "GET",
        }
      );
      if (!response.ok) throw new Error(t("errors.runCron"));
      await fetchJobs();
    } catch (error) {
      console.error(t("errors.runCron"), error);
    } finally {
      setIsRunningCron(false);
    }
  };

  const handleBackClick = () => {
    router.push(context ? `/?context=${context}` : "/");
  };

  useEffect(() => {
    if (context) {
      fetchJobs();
    }
  }, [context, fetchJobs]);

  if (channelsError) return <ErrorMessage />;
  if (isChannelsLoading) return <LoadingScreen />;

  const channelOptions =
    channels?.map((c) => ({
      value: c.channel_id.toString(),
      content: c.channel_name,
    })) || [];

  const localeOptions = availableLocales.map((l) => ({
    value: l.code,
    content: l.title || l.code,
  }));

  const columns = [
    {
      header: t("columnHeaders.id"),
      hash: "id",
      render: (item: TranslationJob) => item.id,
    },
    {
      header: t("columnHeaders.type"),
      hash: "type",
      render: (item: TranslationJob) =>
        item.jobType === "import" ? t("columnHeaders.import") : t("columnHeaders.export"),
    },
    {
      header: t("columnHeaders.status"),
      hash: "status",
      render: (item: TranslationJob) => (
        <Flex alignItems="center" marginBottom="none">
          {item.status === "processing" && <ProgressCircle size="small" />}
          <Text>{t(`status_${item.status}`)}</Text>
          {item.error && (
            <Tooltip
              trigger={<Box display="inline-block"><Text color="danger">(!)</Text></Box>}
              placement="right-end"
            >
              {item.error}
            </Tooltip>
          )}
        </Flex>
      ),
    },
    {
      header: t("columnHeaders.channel"),
      hash: "channel",
      render: (item: TranslationJob) =>
        channels?.find((c) => c.channel_id === item.channelId)?.channel_name ||
        item.channelId,
    },
    {
      header: t("columnHeaders.locale"),
      hash: "locale",
      render: (item: TranslationJob) => {
        return item.locale;
      },
    },
    {
      header: t("columnHeaders.created"),
      hash: "created",
      render: (item: TranslationJob) =>
        new Date(item.createdAt).toLocaleString(),
    },
    {
      header: t("columnHeaders.actions"),
      hash: "actions",
      render: (item: TranslationJob) => (
        <Dropdown
          items={[
            {
              content: item.jobType === "export" ? t("download") : t("view"),
              onItemClick: () => window.open(item.fileUrl, "_blank"),
              disabled: item.status !== "completed" || !item.fileUrl,
            },
          ]}
          maxHeight={250}
          placement="bottom-end"
          toggle={
            <Button variant="utility" iconOnly={<MoreHorizIcon />} />
          }
        />
      ),
    },
  ];

  const paginationProps: OffsetPaginationProps = {
    currentPage,
    totalItems: jobs.length,
    itemsPerPage,
    onPageChange: setCurrentPage,
    itemsPerPageOptions: [10, 20, 50, 100],
    onItemsPerPageChange: (newItemsPerPage) => {
      setCurrentPage(1);
      setItemsPerPage(newItemsPerPage);
    },
  };

  const paginatedJobs = jobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Page
      header={
        <Header
          actions={[
            {
              items: [
                {
                  content: t("importModal.title"),
                  onItemClick: () => setShowImportModal(true),
                  icon: <ArrowUpwardIcon />,
                },
                {
                  content: t("exportModal.title"),
                  onItemClick: () => setShowExportModal(true),
                  icon: <FileDownloadIcon />,
                },
                // Refresh button for debugging cron locally
                ...(process.env.NODE_ENV === 'development' ? [{
                  content: t("refresh"),
                  icon: <RedoIcon />,
                  onItemClick: () => {
                    handleRunCron();
                  },
                }] : []),
              ],
              toggle: {
                text: t("actions.button"),
                variant: "primary",
                iconRight: <ArrowDropDownIcon />,
                isLoading: isRunningCron,
              },
            },
          ]}
          title={t("pageTitle")}
          description={t("pageDescription")}
          backLink={{
            text: t("navigation.back"),
            onClick: handleBackClick,
            href: "#",
          }}
        />
      }
    >
      <Flex flexDirection="column" flexGap={defaultTheme.spacing.xLarge}>
        <FlexItem>
          <Panel
            header={t("tableTitle")}
          >
            <StyledPanelContents>
              <Table
                columns={columns}
                items={paginatedJobs}
                stickyHeader
                itemName={t("pageTitle")}
                pagination={paginationProps}
                emptyComponent={
                  isLoading ? (
                    <Flex alignItems="center" justifyContent="center" paddingVertical="xxLarge" paddingHorizontal="medium">
                      <ProgressCircle size="medium" />
                    </Flex>
                  ) : (
                    <Flex
                      alignItems="center"
                      justifyContent="center"
                      flexDirection="column"
                      paddingVertical="xxLarge"
                      paddingHorizontal="medium"
                    >
                      <Text marginBottom="small">{t("emptyState.title")}</Text>
                      <Text>{t("emptyState.description")}</Text>
                    </Flex>
                  )
                }
              />
            </StyledPanelContents>
          </Panel>
        </FlexItem>
      </Flex>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setSelectedChannel(null);
          setSelectedLocale("");
        }}
        closeOnClickOutside={false}
        closeOnEscKey={false}
        header={t("importModal.title")}
        actions={[
          {
            text: t("importModal.cancel"),
            variant: "subtle",
            onClick: () => {
              setShowImportModal(false);
              setSelectedChannel(null);
              setSelectedLocale("");
            }
          },
          {
            text: t("importModal.next"),
            variant: "primary",
            onClick: () => {
              if (selectedChannel && selectedLocale) {
                setShowImportModal(false);
                setShowUploadModal(true);
              }
            },
            disabled: !selectedChannel || !selectedLocale
          }
        ]}
      >
        <Box padding="medium">
          <FormGroup>
            <Flex>
              <FlexItem flexGrow={1} marginRight="medium">
                <Select
                  label={t("importModal.selectChannel")}
                  options={channelOptions}
                  onOptionChange={(value) => {
                    setSelectedChannel(value ? Number(value) : null);
                    setSelectedLocale("");
                  }}
                  value={selectedChannel?.toString() || ""}
                  required
                />
              </FlexItem>

              <FlexItem flexGrow={1}>
                <Select
                  label={t("importModal.selectLocale")}
                  options={localeOptions}
                  onOptionChange={(value) => setSelectedLocale(value || "")}
                  value={selectedLocale}
                  disabled={!selectedChannel}
                  required
                />
              </FlexItem>
            </Flex>
          </FormGroup>
        </Box>
      </Modal>

      {/* Export Modal */}
      <Modal
        isOpen={showExportModal}
        onClose={() => {
          setShowExportModal(false);
          setSelectedChannel(null);
          setSelectedLocale("");
        }}
        closeOnClickOutside={false}
        closeOnEscKey={false}
        header={t("exportModal.title")}
        actions={[
          {
            text: t("exportModal.cancel"),
            variant: "subtle",
            onClick: () => {
              setShowExportModal(false);
              setSelectedChannel(null);
              setSelectedLocale("");
            }
          },
          {
            text: t("exportModal.export"),
            variant: "primary",
            onClick: () => handleCreateJob("export"),
            disabled: !selectedChannel || !selectedLocale || isCreatingJob,
            isLoading: isCreatingJob
          }
        ]}
      >
        <Box padding="medium">
          <FormGroup>
            <Flex>
              <FlexItem flexGrow={1} marginRight="medium">
                <Select
                  label={t("exportModal.selectChannel")}
                  options={channelOptions}
                  onOptionChange={(value) => {
                    setSelectedChannel(value ? Number(value) : null);
                    setSelectedLocale("");
                  }}
                  value={selectedChannel?.toString() || ""}
                  required
                />
              </FlexItem>

              <FlexItem flexGrow={1}>
                <Select
                  label={t("exportModal.selectLocale")}
                  options={localeOptions}
                  onOptionChange={(value) => setSelectedLocale(value || "")}
                  value={selectedLocale}
                  disabled={!selectedChannel}
                  required
                />
              </FlexItem>
            </Flex>
          </FormGroup>
        </Box>
      </Modal>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
        closeOnClickOutside={false}
        closeOnEscKey={false}
        header={t("importModal.upload.title")}
        actions={[
          {
            text: t("importModal.cancel"),
            variant: "subtle",
            onClick: () => {
              setShowUploadModal(false);
              setSelectedFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            },
            disabled: isCreatingJob,
          },
          {
            text: selectedFile ? t("importModal.upload.uploadButton") : t("importModal.upload.selectFile"),
            variant: "primary",
            onClick: selectedFile
              ? handleUpload
              : () => fileInputRef.current?.click(),
            isLoading: isCreatingJob,
          },
        ]}
      >
        <FormGroup>
          <Text>{t("importModal.upload.dragAndDrop")}</Text>
        </FormGroup>
        <FormGroup>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ marginTop: defaultTheme.spacing.small }}
          />
          {selectedFile && (
            <Text marginTop="small">
              {t("importModal.upload.selectedFile", { filename: selectedFile.name })}
            </Text>
          )}
        </FormGroup>
      </Modal>
    </Page>
  );
}

export default function TranslationsJobs() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <TranslationsJobsContent />
    </Suspense>
  );
}
