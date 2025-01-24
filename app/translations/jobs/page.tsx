'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
  Box,
  Button,
  Flex,
  FlexItem,
  Message,
  Modal,
  Panel,
  Select,
  Table,
  Text,
  Tooltip,
  ProgressCircle,
  FormGroup
} from '@bigcommerce/big-design';
import { CloudUploadIcon, FileDownloadIcon, RedoIcon } from '@bigcommerce/big-design-icons';
import { Header, Page } from '@bigcommerce/big-design-patterns';
import { theme } from '@bigcommerce/big-design-theme';
import { useChannels } from '@/hooks/useChannels';
import ErrorMessage from '@/components/error-message';
import { LoadingScreen } from '@/components/loading-indicator';

type TranslationJob = {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  jobType: 'import' | 'export';
  fileUrl?: string;
  channelId: number;
  locale: string;
  error?: string;
  createdAt: string;
  updatedAt: string;
};

export default function TranslationsJobs() {
  const t = useTranslations('translations.jobs');
  const searchParams = useSearchParams();
  const context = searchParams?.get('context');
  const [jobs, setJobs] = useState<TranslationJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<number | null>(null);
  const [selectedLocale, setSelectedLocale] = useState<string>('');
  const [isCreatingJob, setIsCreatingJob] = useState(false);
  const [isRunningCron, setIsRunningCron] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    channels,
    isLoading: isChannelsLoading,
    error: channelsError
  } = useChannels(context ?? null);

  // Get available locales for selected channel
  const availableLocales = selectedChannel 
    ? channels?.find(c => c.channel_id === selectedChannel)?.locales || []
    : [];

  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch(`/api/translations/jobs?context=${context}`);
      if (!response.ok) throw new Error('Failed to fetch jobs');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  const handleCreateJob = async (jobType: 'import' | 'export') => {
    if (!selectedChannel || !selectedLocale) return;

    if (jobType === 'import') {
      setShowUploadModal(true);
      return;
    }

    setIsCreatingJob(true);
    try {
      const response = await fetch(`/api/translations/jobs?context=${context}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobType,
          channelId: selectedChannel,
          locale: selectedLocale,
        }),
      });

      if (!response.ok) throw new Error('Failed to create job');
      fetchJobs();
    } catch (error) {
      console.error('Error creating job:', error);
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
      formData.append('file', selectedFile);
      formData.append('channelId', selectedChannel!.toString());
      formData.append('locale', selectedLocale);

      // Upload file and create job
      const response = await fetch(`/api/translations/jobs?context=${context}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      setShowUploadModal(false);
      setSelectedFile(null);
      fetchJobs();
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsCreatingJob(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRunCron = async () => {
    setIsRunningCron(true);
    try {
      const response = await fetch(`/api/translations/cron?context=${context}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to run cron job');
      await fetchJobs();
    } catch (error) {
      console.error('Error running cron:', error);
    } finally {
      setIsRunningCron(false);
    }
  };

  const handleBackClick = () => {
    router.push(context ? `/?context=${context}` : '/');
  };

  useEffect(() => {
    if (context) {
      fetchJobs();
    }
  }, [context, fetchJobs]);

  if (channelsError) return <ErrorMessage />;
  if (isChannelsLoading) return <LoadingScreen />;

  const channelOptions = channels?.map(c => ({
    value: c.channel_id.toString(),
    content: c.channel_name,
  })) || [];

  const localeOptions = availableLocales.map(l => ({
    value: l.code,
    content: l.title || l.code,
  }));

  const columns = [
    { 
      header: 'ID', 
      hash: 'id', 
      render: (item: TranslationJob) => item.id 
    },
    { 
      header: t('type'),
      hash: 'type',
      render: (item: TranslationJob) => 
        item.jobType === 'import' ? t('import') : t('export')
    },
    {
      header: t('status'),
      hash: 'status',
      render: (item: TranslationJob) => (
        <Flex alignItems="center" marginBottom="none">
          {item.status === 'processing' && <ProgressCircle size="small" />}
          <Text>{t(`status_${item.status}`)}</Text>
          {item.error && (
            <Tooltip 
              trigger={<Text color="danger">(!)</Text>}
              placement="right"
            >
              {item.error}
            </Tooltip>
          )}
        </Flex>
      )
    },
    {
      header: t('channel'),
      hash: 'channel',
      render: (item: TranslationJob) => 
        channels?.find(c => c.channel_id === item.channelId)?.channel_name || item.channelId
    },
    { 
      header: t('locale'),
      hash: 'locale',
      render: (item: TranslationJob) => {
        const channel = channels?.find(c => c.channel_id === item.channelId);
        const localeInfo = channel?.locales.find(l => l.code === item.locale);
        return localeInfo?.title || item.locale;
      }
    },
    {
      header: t('created'),
      hash: 'created',
      render: (item: TranslationJob) => new Date(item.createdAt).toLocaleString()
    },
    {
      header: t('actions'),
      hash: 'actions',
      render: (item: TranslationJob) => (
        <Button
          variant="secondary"
          disabled={item.status !== 'completed' || !item.fileUrl}
          onClick={() => window.open(item.fileUrl, '_blank')}
        >
          {item.jobType === 'export' ? t('download') : t('view')}
        </Button>
      )
    }
  ];

  return (
    <Page
      header={
        <Header
          title={t('title')}
          backLink={{
            text: 'Back',
            onClick: handleBackClick,
            href: '#'
          }}
        />
      }
    >
      <Flex flexDirection="column" flexGap={theme.spacing.xLarge}>
        <FlexItem>
          <Panel>
            <Flex justifyContent="space-between" alignItems="flex-end">
              <Flex flexDirection="row" alignItems="flex-end" flexGap={theme.spacing.xLarge}>
                <Select
                  label={t('selectChannel')}
                  options={channelOptions}
                  onOptionChange={value => {
                    setSelectedChannel(value ? Number(value) : null);
                    setSelectedLocale('');
                  }}
                  value={selectedChannel?.toString() || ''}
                  required
                />
                
                <Select
                  label={t('selectLocale')}
                  options={localeOptions}
                  onOptionChange={value => setSelectedLocale(value || '')}
                  value={selectedLocale}
                  disabled={!selectedChannel}
                  required
                />
              </Flex>

              <Flex flexGap="medium">
                <Button
                  variant="secondary"
                  iconLeft={<CloudUploadIcon />}
                  onClick={() => handleCreateJob('import')}
                  disabled={!selectedChannel || !selectedLocale || isCreatingJob}
                  isLoading={isCreatingJob}
                >
                  {t('import')}
                </Button>

                <Button
                  variant="secondary"
                  iconLeft={<FileDownloadIcon />}
                  onClick={() => handleCreateJob('export')}
                  disabled={!selectedChannel || !selectedLocale || isCreatingJob}
                  isLoading={isCreatingJob}
                >
                  {t('export')}
                </Button>
              </Flex>
            </Flex>
          </Panel>
        </FlexItem>

        <FlexItem>
          <Panel
            header={t('title')}
            action={{
              variant: 'secondary',
              text: t('refresh'),
              iconLeft: <RedoIcon />,
              isLoading: isRunningCron,
              onClick: () => {
                handleRunCron();
              },
            }}
          >
            <Table
              columns={columns}
              items={jobs}
              stickyHeader
              itemName="Translation Jobs"
            />
          </Panel>
        </FlexItem>
      </Flex>

      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false);
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
        closeOnClickOutside={false}
        closeOnEscKey={false}
        header="Upload Translation File"
        actions={[
          {
            text: 'Cancel',
            variant: 'subtle',
            onClick: () => {
              setShowUploadModal(false);
              setSelectedFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            },
            disabled: isCreatingJob
          },
          {
            text: selectedFile ? 'Upload' : 'Select File',
            variant: 'primary',
            onClick: selectedFile ? handleUpload : () => fileInputRef.current?.click(),
            isLoading: isCreatingJob
          }
        ]}
      >
        <FormGroup>
          <Text>Select a CSV file containing your translations.</Text>
        </FormGroup>
        <FormGroup>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            style={{ marginTop: theme.spacing.small }}
          />
          {selectedFile && (
            <Text marginTop="small">Selected file: {selectedFile.name}</Text>
          )}
        </FormGroup>
      </Modal>
    </Page>
  );
} 