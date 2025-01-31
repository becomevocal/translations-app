"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import styled from "styled-components";
import Papa from "papaparse";
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
  TableFigure,
} from "@bigcommerce/big-design";
import {
  ArrowDropDownIcon,
  ArrowUpwardIcon,
  FileDownloadIcon,
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

type CSVPreview = {
  headers: string[];
  firstRow: string[];
};

type CSVPreviewRow = {
  [key: string]: string;
};

const StyledPanelContents = styled.div`
  display: block;
  box-sizing: border-box;
  margin-inline: -${defaultTheme.spacing.medium};
  max-width: calc(
    100% + ${defaultTheme.spacing.medium}px + ${defaultTheme.spacing.medium}px
  );
  overflow-x: auto;
  @media (min-width: ${defaultTheme.breakpointValues.tablet}) {
    margin-inline: -${defaultTheme.spacing.xLarge};
    max-width: calc(
      100% + ${defaultTheme.spacing.xLarge}px + ${defaultTheme.spacing.xLarge}px
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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CSVPreview | null>(null);
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setCsvPreview(null);
      return;
    }

    setSelectedFile(file);

    Papa.parse(file, {
      header: false,
      preview: 2, // Only parse first two rows
      complete: (results) => {
        if (results.data.length >= 2) {
          const [headers, firstRow] = results.data as string[][];
          setCsvPreview({
            headers: headers.map((header) => header.trim()),
            firstRow: firstRow.map((cell) => cell.trim()),
          });
          setShowPreviewModal(true);
        } else {
          setCsvPreview(null);
        }
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        setCsvPreview(null);
      },
    });
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
      setShowPreviewModal(false);
      setSelectedFile(null);
      setCsvPreview(null);
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

  const handleChannelChange = (selectedChannelId: string) => {
    const channelId = Number(selectedChannelId);
    const selectedChannel = channels?.find(
      (channel) => channel.channel_id === channelId
    );
    
    if (selectedChannel) {
      setSelectedChannel(channelId);
      // Match product form logic: use first non-default locale or fall back to first locale
      const newLocale = selectedChannel.locales?.[1]?.code || 
        selectedChannel.locales[0].code;
      setSelectedLocale(newLocale);

      // Save selections to localStorage
      localStorage.setItem('translations_selected_channel', channelId.toString());
      localStorage.setItem('translations_selected_locale', newLocale);
    }
  };

  // Update locale selection and save to localStorage
  const handleLocaleChange = (value: string) => {
    setSelectedLocale(value || "");
    localStorage.setItem('translations_selected_locale', value);
  };

  // Load saved preferences or set defaults when channels load
  useEffect(() => {
    if (channels?.length && !selectedChannel) {
      const savedChannelId = localStorage.getItem('translations_selected_channel');
      const savedLocale = localStorage.getItem('translations_selected_locale');
      
      // Find the saved channel if it exists in current channels
      const savedChannel = savedChannelId ? 
        channels.find(c => c.channel_id === Number(savedChannelId)) : 
        null;
      
      if (savedChannel && savedLocale && 
          savedChannel.locales.some(l => l.code === savedLocale)) {
        // Use saved preferences if valid
        setSelectedChannel(savedChannel.channel_id);
        setSelectedLocale(savedLocale);
      } else {
        // Fall back to defaults
        const firstChannel = channels[0];
        setSelectedChannel(firstChannel.channel_id);
        const newLocale = firstChannel.locales?.[1]?.code || 
          firstChannel.locales[0].code;
        setSelectedLocale(newLocale);
        
        // Save defaults
        localStorage.setItem('translations_selected_channel', firstChannel.channel_id.toString());
        localStorage.setItem('translations_selected_locale', newLocale);
      }
    }
  }, [channels, selectedChannel]);

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
        item.jobType === "import"
          ? t("columnHeaders.import")
          : t("columnHeaders.export"),
    },
    {
      header: t("columnHeaders.status"),
      hash: "status",
      render: (item: TranslationJob) => (
        <Flex alignItems="center" marginBottom="none">
          {item.status === "processing" && (
            <Box marginRight="xSmall">
              <ProgressCircle size="xSmall" />
            </Box>
          )}
          <Text>{t(`status_${item.status}`)}</Text>
          {item.error && (
            <Tooltip
              trigger={
                <Box display="inline-block">
                  <Text color="danger">(!)</Text>
                </Box>
              }
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
          toggle={<Button variant="utility" iconOnly={<MoreHorizIcon />} />}
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
              ],
              toggle: {
                text: t("actions.button"),
                variant: "primary",
                iconRight: <ArrowDropDownIcon />,
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
          <Panel header={t("tableTitle")}>
            <StyledPanelContents>
              <Table
                columns={columns}
                items={paginatedJobs}
                stickyHeader
                itemName={t("pageTitle")}
                pagination={paginationProps}
                emptyComponent={
                  isLoading ? (
                    <Flex
                      alignItems="center"
                      justifyContent="center"
                      paddingVertical="xxLarge"
                      paddingHorizontal="medium"
                    >
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
            },
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
            disabled: !selectedChannel || !selectedLocale,
          },
        ]}
      >
        <Box padding="medium">
          <FormGroup>
            <Flex>
              <FlexItem flexGrow={1} marginRight="medium">
                <Select
                  label={t("importModal.selectChannel")}
                  options={channelOptions}
                  onOptionChange={handleChannelChange}
                  value={selectedChannel?.toString() || ""}
                  required
                />
              </FlexItem>

              <FlexItem flexGrow={1}>
                <Select
                  label={t("importModal.selectLocale")}
                  options={localeOptions}
                  onOptionChange={handleLocaleChange}
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
            },
          },
          {
            text: t("exportModal.export"),
            variant: "primary",
            onClick: () => handleCreateJob("export"),
            disabled: !selectedChannel || !selectedLocale || isCreatingJob,
            isLoading: isCreatingJob,
          },
        ]}
      >
        <Box padding="medium">
          <FormGroup>
            <Flex>
              <FlexItem flexGrow={1} marginRight="medium">
                <Select
                  label={t("exportModal.selectChannel")}
                  options={channelOptions}
                  onOptionChange={handleChannelChange}
                  value={selectedChannel?.toString() || ""}
                  required
                />
              </FlexItem>

              <FlexItem flexGrow={1}>
                <Select
                  label={t("exportModal.selectLocale")}
                  options={localeOptions}
                  onOptionChange={handleLocaleChange}
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
        isOpen={showUploadModal && !showPreviewModal}
        onClose={() => {
          setShowUploadModal(false);
          setShowImportModal(true);
          setSelectedFile(null);
          setCsvPreview(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}
        closeOnClickOutside={false}
        closeOnEscKey={false}
        header={t("importModal.upload.title")}
        actions={[
          {
            text: t("navigation.back"),
            variant: "subtle",
            onClick: () => {
              setShowUploadModal(false);
              setShowImportModal(true);
              setSelectedFile(null);
              setCsvPreview(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            },
            disabled: isCreatingJob,
          },
          {
            text: t("importModal.upload.selectFile"),
            variant: "primary",
            onClick: () => fileInputRef.current?.click(),
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
        </FormGroup>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setShowUploadModal(true);
          setCsvPreview(null);
        }}
        closeOnClickOutside={false}
        closeOnEscKey={false}
        header="Preview CSV Contents"
        actions={[
          {
            text: t("navigation.back"),
            variant: "subtle",
            onClick: () => {
              setShowPreviewModal(false);
              setShowUploadModal(true);
              setCsvPreview(null);
            },
            disabled: isCreatingJob,
          },
          {
            text: t("importModal.upload.uploadButton"),
            variant: "primary",
            onClick: handleUpload,
            isLoading: isCreatingJob,
          },
        ]}
      >
        {csvPreview && (
          <Box padding="medium">
            <Box border="box" borderRadius="normal">
              <TableFigure>
                <Table<CSVPreviewRow>
                  columns={csvPreview.headers.map((header) => ({
                    header: header,
                    hash: header,
                    render: (item: CSVPreviewRow) => (
                      <Text>{item[header]}</Text>
                    ),
                    verticalAlign: "top",
                  }))}
                  items={[
                    csvPreview.firstRow.reduce(
                      (obj, value, index) => ({
                        ...obj,
                        [csvPreview.headers[index]]: value,
                      }),
                      {} as CSVPreviewRow
                    ),
                  ]}
                  stickyHeader
                />
              </TableFigure>
            </Box>
          </Box>
        )}
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
