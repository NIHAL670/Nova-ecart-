/**
 * Reusable MongoDB query builder: search → filter → sort → select → paginate.
 *
 * Controllers chain the fluent steps and then `.build()` to obtain the
 * final `{ search, filter, sort, limit, page, skip }` used for the query and
 * for accurate pagination metadata (via a parallel count()).
 *
 * Query-param conventions:
 *  - `q`         => substring search across `searchableFields`
 *  - any model field can be filtered exactly (e.g. `category`, `brand`)
 *  - `priceMin` / `priceMax` => numeric range on `price`
 *  - `sort`      => `price,-rating` (comma list, `-` = descending)
 *  - `page`, `limit` => 1-based pagination, limit clamped to [1,100]
 *  - `select`    => comma list of fields to project
 */
import { Model, Query } from 'mongoose';

export interface BuildArgs {
  search: string;
  filter: Record<string, unknown>;
  sort: string;
  limit: number;
  page: number;
  skip: number;
}

const UTILITY_KEYS = ['page', 'limit', 'search', 'sort', 'select', 'priceMin', 'priceMax'];

export class ApiFeatures<T> {
  private query: Query<unknown[], unknown, unknown, unknown, 'find'>;
  private options: BuildArgs;

  constructor(model: Model<T>, queryString: Record<string, unknown>, private searchableFields: string[] = ['name']) {
    const q = { ...queryString };
    for (const key of UTILITY_KEYS) delete q[key];

    this.options = {
      search: String(queryString.search ?? ''),
      filter: q,
      sort: String(queryString.sort ?? '-createdAt'),
      limit: Math.min(Number(queryString.limit) || 20, 100),
      page: Math.max(Number(queryString.page) || 1, 1),
      skip: 0,
    };
    this.options.skip = (this.options.page - 1) * this.options.limit;

    this.query = model.find({ deletedAt: null }) as unknown as Query<unknown[], unknown, unknown, unknown, 'find'>;
  }

  /** Substring match (regex, escaped) across the whitelisted searchable fields. */
  search(): this {
    if (!this.options.search) return this;
    const escaped = this.options.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    this.query.find({
      $or: this.searchableFields.map((field) => ({ [field]: { $regex: escaped, $options: 'i' } })),
    });
    return this;
  }

  /** Exact-match filter for every remaining query param (skips empties). */
  filter(): this {
    const clean: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(this.options.filter)) {
      if (value === '' || value === undefined || value === null) continue;
      if (key === 'inStock') {
        if (value === 'true' || value === true) {
          this.query.find({ stock: { $gt: 0 } });
        } else if (value === 'false' || value === false) {
          this.query.find({ stock: 0 });
        }
        continue;
      }
      clean[key] = value;
    }
    if (Object.keys(clean).length) this.query.find(clean);
    return this;
  }

  /** Numeric range filter derived from `priceMin` / `priceMax` query params. */
  priceRange(): this {
    const range: Record<string, number> = {};
    const { filter } = this.options;
    if (filter.priceMin !== undefined) range.$gte = Number(filter.priceMin);
    if (filter.priceMax !== undefined) range.$lte = Number(filter.priceMax);
    if (Object.keys(range).length) this.query.find({ price: range });
    return this;
  }

  sort(): this {
    const normalized = this.options.sort
      .split(',')
      .map((part) => {
        const descending = part.startsWith('-');
        const field = descending ? part.slice(1) : part;
        return `${descending ? '-' : ''}${field}`;
      })
      .join(' ');
    this.query.sort(normalized);
    return this;
  }

  /** Project a subset of fields. */
  select(fields?: string): this {
    if (fields) this.query.select(fields.replace(/,/g, ' '));
    return this;
  }

  paginate(): this {
    this.query.skip(this.options.skip).limit(this.options.limit);
    return this;
  }

  /** Resolve the fully-built query for `await`. */
  async execute<TResult = T>(): Promise<TResult[]> {
    return (await this.query.exec()) as unknown as TResult[];
  }

  build(): BuildArgs {
    return this.options;
  }

  getFilter(): Record<string, any> {
    return this.query.getFilter();
  }
}