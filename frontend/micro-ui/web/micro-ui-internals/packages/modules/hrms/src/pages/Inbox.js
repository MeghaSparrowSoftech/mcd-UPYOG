import { Header, Loader } from "@nudmcdgnpm/digit-ui-react-components";
import React, { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import DesktopInbox from "../components/inbox/DesktopInbox";
import MobileInbox from "../components/inbox/MobileInbox";

const Inbox = ({ parentRoute, businessService = "HRMS", initialStates = {}, filterComponent, isInbox }) => {
  const tenantId = Digit.ULBService.getCurrentTenantId();
  const { isLoading: isLoading, data: res } = Digit.Hooks.hrms.useHRMSCount(tenantId);
  const { t } = useTranslation();

  const [pageOffset, setPageOffset] = useState(initialStates.pageOffset || 0);
  const [pageSize, setPageSize] = useState(initialStates.pageSize || 10);
  const [sortParams, setSortParams] = useState(initialStates.sortParams || [{ id: "createdTime", desc: false }]);
  const [totalRecords, setTotalReacords] = useState(undefined);

  const [searchParams, setSearchParams] = useState(() => initialStates.searchParams || {});

  // ZONE MDMS
  const { data: zoneMdmsData } = Digit.Hooks.useCustomMDMS(
    tenantId,
    "egov-location",
    [{ name: "TenantBoundary" }],
    {
      select: (data) => {
        const zones = data?.["egov-location"]?.TenantBoundary?.[0]?.boundary?.children || [];
        return zones.map((zone) => ({
          code: zone.code,
          name: zone.name || zone.code,
          i18text: zone.name || zone.code,
        }));
      },
      enabled: !!tenantId,
    }
  );

  // Detect zone search
  const isZoneSearch = !!searchParams?.zone;

  // 🔥 Always backend pagination — never load all
  let paginationParams;

  if (isZoneSearch) {
    paginationParams = {
      limit: 50,                          // FIXED 50 records per page
      offset: pageOffset,                 // backend sends next set
      sortOrder: sortParams?.[0]?.desc ? "DESC" : "ASC"
    };
  } else {
    paginationParams = {
      limit: pageSize,                    // Normal pagination
      offset: pageOffset,
      sortOrder: sortParams?.[0]?.desc ? "DESC" : "ASC"
    };
  }

  const isupdate = Digit.SessionStorage.get("isupdate");

  const { isLoading: hookLoading, data, ...rest } = Digit.Hooks.hrms.useHRMSSearch(
    searchParams,
    tenantId,
    paginationParams,
    isupdate
  );

  // Reset to first page when filters change
  useEffect(() => {
    if (isZoneSearch) {
      setPageSize(50);      // Zone search always shows 50 per page
    }
    setPageOffset(0);
  }, [searchParams]);

  const fetchNextPage = () => {
    setPageOffset((prev) => prev + pageSize);    // +50 when zone search
  };

  const fetchPrevPage = () => {
    setPageOffset((prev) => prev - pageSize);
  };

  const handleFilterChange = (filterParam) => {
    let keys_to_delete = filterParam.delete;
    let _new = { ...searchParams, ...filterParam };
    if (keys_to_delete) keys_to_delete.forEach((key) => delete _new[key]);
    delete _new.delete;
    setSearchParams({ ..._new });
  };

  const handleSort = useCallback((args) => {
    if (args.length === 0) return;
    setSortParams(args);
  }, []);

  const handlePageSizeChange = (e) => {
    if (!isZoneSearch) {
      setPageSize(Number(e.target.value));   // Only normal search can edit page size
    }
  };

  const getSearchFields = () => {
    return [
      { label: t("HR_EMPLOYEE_ID_LABEL"), name: "codes" },
      {
        label: t("HR_MOB_NO_LABEL"),
        name: "phone",
        maxlength: 10,
        pattern: "[6-9][0-9]{9}",
        title: t("ES_SEARCH_APPLICATION_MOBILE_INVALID"),
        componentInFront: "+91",
      },
      {
        label: t("HR_ZONE_LABEL"),
        name: "zone",
        type: "select",
        options: zoneMdmsData,
      },
    ];
  };

  if (isLoading) return <Loader />;

  if (data?.length !== null) {
    const isMobile = window.Digit.Utils.browser.isMobile();

    if (isMobile) {
      return (
        <MobileInbox
          businessService={businessService}
          data={data}
          isLoading={hookLoading}
          defaultSearchParams={initialStates.searchParams}
          isSearch={!isInbox}
          onFilterChange={handleFilterChange}
          searchFields={getSearchFields()}
          onSearch={handleFilterChange}
          onSort={handleSort}
          onNextPage={fetchNextPage}
          tableConfig={rest?.tableConfig}
          onPrevPage={fetchPrevPage}
          currentPage={Math.floor(pageOffset / pageSize)}
          pageSizeLimit={pageSize}
          disableSort={false}
          onPageSizeChange={handlePageSizeChange}
          parentRoute={parentRoute}
          searchParams={searchParams}
          sortParams={sortParams}
          totalRecords={totalRecords}
          linkPrefix={'/digit-ui/employee/hrms/details/'}
          filterComponent={filterComponent}
        />
      );
    } else {
      return (
        <div>
          {isInbox && <Header>{t("HR_HOME_SEARCH_RESULTS_HEADING")}</Header>}

          <DesktopInbox
            businessService={businessService}
            data={data}
            isLoading={hookLoading}
            defaultSearchParams={initialStates.searchParams}
            isSearch={!isInbox}
            onFilterChange={handleFilterChange}
            searchFields={getSearchFields()}
            onSearch={handleFilterChange}
            onSort={handleSort}
            onNextPage={fetchNextPage}
            onPrevPage={fetchPrevPage}
            currentPage={Math.floor(pageOffset / pageSize)}
            pageSizeLimit={pageSize}
            disableSort={false}
            onPageSizeChange={handlePageSizeChange}
            parentRoute={parentRoute}
            searchParams={searchParams}
            sortParams={sortParams}
            totalRecords={totalRecords}
            filterComponent={filterComponent}
          />
        </div>
      );
    }
  }
};

export default Inbox;
