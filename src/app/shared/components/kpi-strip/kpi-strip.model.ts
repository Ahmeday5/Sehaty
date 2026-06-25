export interface KpiItem {
  icon: string;         // FA icon class e.g. 'fa-user-doctor'
  value: string;        // display value e.g. '284' or '38,400 ج.م'
  label: string;        // label below value
  variant: 'default' | 'primary' | 'amber' | 'green' | 'red' | 'blue' | 'purple';
  active?: boolean;     // highlighted/selected state for filterable KPIs
}
