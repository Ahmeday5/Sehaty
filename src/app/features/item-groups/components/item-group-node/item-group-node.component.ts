import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ItemGroupLevel, ItemGroupNode, ITEM_GROUP_LEVEL_LABELS } from '../../models/item-group.model';

@Component({
  selector: 'app-item-group-node',
  standalone: true,
  imports: [CommonModule, ItemGroupNodeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './item-group-node.component.html',
  styleUrl: './item-group-node.component.scss',
})
export class ItemGroupNodeComponent {
  @Input({ required: true }) node!: ItemGroupNode;
  @Input() depth = 0;

  @Output() toggle     = new EventEmitter<ItemGroupNode>();
  @Output() addChild   = new EventEmitter<ItemGroupNode>();
  @Output() edit       = new EventEmitter<ItemGroupNode>();
  @Output() remove     = new EventEmitter<ItemGroupNode>();
  @Output() viewItems  = new EventEmitter<ItemGroupNode>();

  readonly ItemGroupLevel = ItemGroupLevel;
  readonly levelLabels    = ITEM_GROUP_LEVEL_LABELS;

  protected get canHaveChildren(): boolean {
    return this.node.level !== ItemGroupLevel.SubGroup;
  }

  protected get isSubGroup(): boolean {
    return this.node.level === ItemGroupLevel.SubGroup;
  }
}
