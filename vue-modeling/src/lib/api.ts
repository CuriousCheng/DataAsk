import { http } from '@dataask/shared-ui'
import { projectName } from './modeling'

export function base(): string {
  return '/api/projects/' + encodeURIComponent(projectName())
}

export interface DataSource {
  id: string
  name: string
  type: string
  host: string
  port: number
  database?: string
  catalog?: string
}

export async function listSources(): Promise<DataSource[]> {
  const r = await http.get<{ items: DataSource[] }>('/api/datasources')
  return r.items || []
}

export async function listSchemas(dsId: string): Promise<string[]> {
  const r = await http.get<{ items: string[] }>(
    '/api/datasources/' + encodeURIComponent(dsId) + '/schemas',
  )
  return r.items || []
}

export async function listTables(dsId: string, schema: string): Promise<string[]> {
  const r = await http.get<{ items: string[] }>(
    '/api/datasources/' +
      encodeURIComponent(dsId) +
      '/tables?schema_name=' +
      encodeURIComponent(schema),
  )
  return r.items || []
}

export interface AddModelPayload {
  datasource_id: string
  schema_name: string
  table: string
  description?: string
  model_name?: string
  primary_key?: string
}

export async function addModel(payload: AddModelPayload) {
  return http.post<{ ok: boolean; model: string; columns: number }>(base() + '/models', payload)
}

export async function removeModel(name: string) {
  return http.del(base() + '/models/' + encodeURIComponent(name))
}

export interface ApiColumn {
  name: string
  type: string
  properties?: Record<string, unknown>
  is_calculated?: boolean
  not_null?: boolean
  is_primary_key?: boolean
}

export interface ApiModelJson {
  name: string
  properties?: Record<string, unknown>
  table_reference?: { catalog?: string; schema?: string; table?: string }
  columns: ApiColumn[]
  primary_key?: string
  cached?: boolean
}

export async function getModelJson(name: string): Promise<ApiModelJson> {
  const r = await http.get<{ ok: boolean; data: ApiModelJson }>(
    base() + '/models/' + encodeURIComponent(name) + '/json',
  )
  return r.data
}

export async function putModelJson(name: string, data: ApiModelJson) {
  return http.put(base() + '/models/' + encodeURIComponent(name) + '/json', { data })
}

export interface ApiRelation {
  name: string
  models: string[]
  join_type: string
  condition: string
}

export async function getRelationships(): Promise<ApiRelation[]> {
  const r = await http.get<{ ok: boolean; data: { relationships: ApiRelation[] } }>(
    base() + '/relationships/json',
  )
  return r.data?.relationships || []
}

export async function putRelationships(list: ApiRelation[]) {
  return http.put(base() + '/relationships/json', { data: { relationships: list } })
}

export async function buildProject() {
  return http.post<{ ok: boolean; output: string }>(base() + '/build', {})
}

export async function indexMemory() {
  return http.post<{ ok: boolean; output: string }>(base() + '/index', {})
}

export interface Cube {
  name: string
  base_object: string
  measures?: unknown[]
  dimensions?: unknown[]
  properties?: Record<string, unknown>
}

export async function listCubes(): Promise<Cube[]> {
  const r = await http.get<{ items: Cube[] }>(base() + '/cubes')
  return r.items || []
}

export function joinTypeToApi(t: string) {
  if (t === '一对一') return 'ONE_TO_ONE'
  if (t === '一对多') return 'ONE_TO_MANY'
  return 'MANY_TO_ONE'
}

export interface CubeItem {
  name: string
  base_object: string
  measures: string[]
  dimensions: string[]
  time_dimensions: string[]
}

export interface CubeField {
  name: string
  expression: string
  type: string
}

export interface CubeJson {
  name: string
  base_object: string
  measures: CubeField[]
  dimensions: CubeField[]
  time_dimensions: CubeField[]
  properties?: Record<string, unknown>
}

export async function listCubeItems(): Promise<CubeItem[]> {
  const r = await http.get<{ ok: boolean; cubes: CubeItem[] }>(base() + '/cubes')
  return r.cubes || []
}

export async function getCubeJson(name: string): Promise<CubeJson> {
  const r = await http.get<{ ok: boolean; data: CubeJson }>(
    base() + '/cubes/' + encodeURIComponent(name) + '/json',
  )
  return r.data
}

export async function createCube(data: CubeJson) {
  return http.post<{ ok: boolean }>(base() + '/cubes', data)
}

export async function putCubeJson(name: string, data: CubeJson) {
  return http.put(base() + '/cubes/' + encodeURIComponent(name) + '/json', { data })
}

export async function deleteCube(name: string) {
  return http.del(base() + '/cubes/' + encodeURIComponent(name))
}