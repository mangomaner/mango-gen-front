// @ts-ignore
/* eslint-disable */
import request from '@/request'

/** 此处后端没有提供注释 POST /fileHistory/rollback */
export async function rollbackToHistoryVersion(
  body: API.ChatHistoryRollbackRequest,
  options?: { [key: string]: any }
) {
  return request<API.BaseResponseBoolean>('/fileHistory/rollback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  })
}
