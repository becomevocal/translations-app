import { Button, Dropdown, DropdownItem, DropdownLinkItem, Table, Link as StyledLink, Badge, Text } from '@bigcommerce/big-design';
import { MoreHorizIcon, SearchIcon } from '@bigcommerce/big-design-icons';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ReactElement, useState, useEffect } from 'react';
import ErrorMessage from '@/components/ErrorMessage';
import Loading from '@/components/LoadingIndicator';
import { LanguagesTableItem } from '@/types';
import { AdvancedPanel, Page } from 'bigcommerce-design-patterns';

const gettext = (inputString: string) => {
  return inputString
}

const Products = () => {
  const router = useRouter();
  const [isAvailableLocalesLoading, setAvailableLocalesInfoLoading] = useState(true);
  const [hasAvailableLocalesLoadingError, setAvailableLocalesInfoLoadingError] = useState(false);
  const [availableLocales, setAvailableLocales] = useState<{ id: string; name: string, is_supported: boolean }[]>([]);

  useEffect(() => {
  const fetchAvailableLocales = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const context = urlParams.get('context');
      const res = await fetch(`/api/available-locales?context=${context}`);
      const data = await res.json() as any;
      setAvailableLocales(data);
    } catch (error) {
      setAvailableLocalesInfoLoadingError(true);
    } finally {
      setAvailableLocalesInfoLoading(false);
    }
  };

  fetchAvailableLocales();
}, []);

  const tableItems: LanguagesTableItem[] = [
    {
        "code": "en",
        "status": "active",
        "is_default": true
    },
    {
        "code": "es",
        "status": "active",
        "is_default": false
    }
  ]

  const items = tableItems.map(({ code, is_default: isDefault, status }) => ({
    title: availableLocales.find(({ id }) => id === code)?.name,
    code,
    status,
    isDefault,
  }));

  const renderLocaleCode = (code: string, is_default: boolean): ReactElement => (
    <Text>{code} <Badge label="default" variant="success" /></Text>
  );

  const renderStatus = (status: string): ReactElement => (<Badge label={status} variant={status === 'active' ? 'success' : 'secondary'} />)

  const renderAction = (code: string): ReactElement => (
    <Dropdown
      items={[ { content: 'Edit product', onItemClick: () => router.push(`/products/${code}`), hash: 'edit' } ]}
      toggle={<Button iconOnly={<MoreHorizIcon color="secondary60" />} variant="subtle" />}
    />
  );

  if (hasAvailableLocalesLoadingError) return <ErrorMessage />;

  return (
    <Page headerTitle="Locales">
      <AdvancedPanel headerTitle="Languages" panelDescription="These are the default languages for your storefronts.">
        <Loading isLoading={isAvailableLocalesLoading}>
          <Table
            columns={[
              {
                header: gettext('Language'),
                hash: 'language',
                render: ({ code, title, isDefault }) => (
                  <>
                    {title} ({code}) {isDefault && <Badge label={gettext('default')} variant="primary" />}
                  </>
                ),
              },
              {
                header: gettext('Status'),
                hash: 'status',
                tooltip: gettext('Status'),
                render: ({ status }) =>
                  status === 'active' ? (
                    <Badge label={gettext('active')} variant="success" />
                  ) : (
                    <Badge label={gettext('inactive')} variant="secondary" />
                  ),
              },
              {
                header: gettext('Actions'),
                hash: 'actions',
                hideHeader: true,
                width: 36,
                render: ({ code, isDefault, status }) => {
                  const dropdownItems: Array<DropdownItem | DropdownLinkItem> = [];
      
                  if (!isDefault) {
                    dropdownItems.push(
                      {
                        content: status === 'active' ? gettext('Make inactive') : gettext('Make active'),
                        onItemClick: () => {
                          // localeStatusSettingModal.openModal({
                          //   code,
                          //   status: status === 'active' ? 'inactive' : 'active',
                          // }),
                        }
                      },
                      {
                        content: gettext('Set as default'),
                        onItemClick: () => {}, //defaultLocaleSettingModal.openModal({ code, status }),
                        disabled: status === 'inactive',
                        tooltip: status === 'inactive' ? gettext('Language must be active') : undefined,
                      },
                      {
                        content: gettext('Delete'),
                        onItemClick: () => {}, // localeDeletingModal.openModal({ code }),
                        actionType: 'destructive',
                      },
                    );
                  }
      
                  return dropdownItems.length > 0 ? (
                    <Dropdown
                      items={dropdownItems}
                      toggle={
                        <Button
                          iconOnly={<MoreHorizIcon title="Actions" />}
                          type="button"
                          variant="subtle"
                        />
                      }
                    />
                  ) : null;
                },
              },
            ]}
            items={items}
          />
        </Loading>
      </AdvancedPanel>
    </Page>
  );
};

export default Products;
