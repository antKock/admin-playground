import { Injectable } from '@angular/core';

import { BaseEntityService } from '@app/core/api/base-entity.service';
import { FundingProgram } from './funding-program.model';

@Injectable({ providedIn: 'root' })
export class FundingProgramService extends BaseEntityService<FundingProgram> {
  constructor() {
    super('funding-programs');
  }

  protected getId(item: FundingProgram): string {
    return item.id;
  }
}
