import { Session, openmrsFetch } from "@openmrs/esm-framework";
import useSWR from "swr";
import moment from "moment";
import { ReportDefinition } from "../types/report-definition";
import { ReportDesign } from "../types/report-design";

interface ReportModel {
  reportName: string;
  status: string;
  requestedBy: string;
  requestedByUserUuid: string;
  requestedOn: string;
  outputFormat: string;
  parameters: any;
  id: string;
  evaluateCompleteDatetime: string;
  schedule: string;
}

export async function getCurrentSession(): Promise<Session> {
  const { data } = await openmrsFetch<Session>('/ws/rest/v1/session');
  return data;
}

export function getLocations() {
  const apiUrl = `/ws/rest/v1/location?tag=Login+Location`;

  const { data } = useSWR<{data: { results: Array<any> } }, Error> (
    apiUrl,
    openmrsFetch
  );

  return {
    locations: data ? data?.data?.results : [],
  };
}

export function getReports(statusesGroup: string, sortBy?:string) : any {
  const reportsUrl = `/ws/rest/v1/reportingrest/reportRequest?statusesGroup=${statusesGroup}` + (sortBy ? `&sortBy=${sortBy}` : '');

  const { data, error, isValidating, mutate } = useSWR<{data: { results: Array<any> } }, Error> (
    reportsUrl,
    openmrsFetch
  );

  const reports = data?.data?.results;
  const reportsArray: Array<any> = reports ? [].concat(...reports.map((report) => mapReportResults(report))) : [];

  return {
    data: reportsArray,
    isError: error,
    isValidating: isValidating,
    mutate
  };
}

export function getReportDefinitions() {
  const apiUrl = `/ws/rest/v1/reportingrest/reportDefinition?v=full`;

  const { data } = useSWR<{data: { results: Array<ReportDefinition> } }, Error> (
    apiUrl,
    openmrsFetch
  );

  return {
    reportDefinitions: data ? data?.data?.results : [],
  };
}

export async function getReportDesigns(reportDefinitionUuid: string): Promise<any> {
  const apiUrl = `/ws/rest/v1/reportingrest/designs?reportDefinitionUuid=${reportDefinitionUuid}`;

  if (reportDefinitionUuid) {
    const { data } = await openmrsFetch<any>(apiUrl);
    const reportDesigns = data?.results;

    return reportDesigns ? [].concat(...reportDesigns.map(design => mapDesignResults(design))) : [];
  }

  return [];
}

function mapDesignResults(design: any) : ReportDesign {
  return {
    name: design.name,
    uuid: design.uuid
  };
}

export async function runReport(reportDefinitionUuid: string, renderModeUuid: string, reportParameters: any) {
  const apiUrl = `/ws/rest/v1/reportingrest/runReport`;

  return openmrsFetch(apiUrl, {
    body: {
      reportDefinitionUuid: reportDefinitionUuid,
      renderModeUuid: renderModeUuid,
      reportParameters: reportParameters
    },
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export async function cancelReportRequest(reportRequestUuid: string) {
  const apiUrl = `/ws/rest/v1/reportingrest/cancelReport?reportRequestUuid=${reportRequestUuid}`;

  return openmrsFetch(apiUrl, {
    method: 'DELETE'
  });
}

export async function preserveReport(reportRequestUuid: string) {
  const apiUrl = `/ws/rest/v1/reportingrest/preserveReport?reportRequestUuid=${reportRequestUuid}`;

  return openmrsFetch(apiUrl, {
    method: 'POST'
  });
}

function mapReportResults(data: any) : ReportModel {
  return {
    id: data.uuid,
    reportName: data.parameterizable.name,
    status: data.status,
    requestedBy: data.requestedBy.person.display,
    requestedByUserUuid: data.requestedBy.uuid,
    requestedOn: moment(data.requestDate).format("YYYY-MM-DD HH:mm"),
    outputFormat: data.renderingMode.label,
    parameters: convertParametersToString(data),
    evaluateCompleteDatetime: moment(data.evaluateCompleteDatetime).format("YYYY-MM-DD HH:mm"),
    schedule: data.schedule
  };
}

function convertParametersToString(data: any) : string {
  let finalString = '';
  const parameters = data.parameterizable.parameters;
  if (parameters.length > 0) {
    parameters.forEach(parameter => {
      let value = data.parameterMappings[parameter.name];
      if (parameter.type === 'java.util.Date') {
        value = moment(value).format("YYYY-MM-DD");
      } else if (parameter.type === 'org.openmrs.Location') {
        value = value?.display;
      }
      finalString = finalString + parameter.label + ': ' + value + ', ';
    });

    finalString = finalString.trim();

    if (finalString.charAt(finalString.length -1) === ',') {
      finalString = finalString.slice(0, -1);
    }
  }

  return finalString;
}
