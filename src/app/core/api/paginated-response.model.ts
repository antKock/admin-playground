export interface PaginationCursors {
  start_cursor: string | null;
  end_cursor: string | null;
}

export interface PaginationLinks {
  self: string;
  next: string | null;
  prev: string | null;
  first: string;
}

export interface PaginationMeta {
  total_count: number;
  page_size: number;
  has_next_page: boolean;
  has_previous_page: boolean;
  cursors: PaginationCursors;
  _links: PaginationLinks;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}
