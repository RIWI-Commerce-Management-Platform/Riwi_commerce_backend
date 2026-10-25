export interface AdvisorProps {
  /** The advisor is identified by its user id, like visits and routes. */
  userId: number;
  name: string;
  email: string;
  phone: string | null;
  documentNumber: string | null;
  zoneId: number | null;
  weeklyVisitGoal: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdateAdvisorProps {
  name?: string;
  email?: string;
  phone?: string | null;
  documentNumber?: string | null;
  zoneId?: number | null;
  weeklyVisitGoal?: number | null;
}

/** ASESOR: a user with the ASESOR role plus its commercial profile (HU-07). */
export class Advisor {
  readonly userId: number;
  name: string;
  email: string;
  phone: string | null;
  documentNumber: string | null;
  zoneId: number | null;
  weeklyVisitGoal: number | null;
  isActive: boolean;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: AdvisorProps) {
    this.userId = props.userId;
    this.name = props.name;
    this.email = props.email;
    this.phone = props.phone;
    this.documentNumber = props.documentNumber;
    this.zoneId = props.zoneId;
    this.weeklyVisitGoal = props.weeklyVisitGoal;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  update(props: UpdateAdvisorProps): void {
    if (props.name !== undefined) this.name = props.name;
    if (props.email !== undefined) this.email = props.email.toLowerCase();
    if (props.phone !== undefined) this.phone = props.phone;
    if (props.documentNumber !== undefined) {
      this.documentNumber = props.documentNumber;
    }
    if (props.zoneId !== undefined) this.zoneId = props.zoneId;
    if (props.weeklyVisitGoal !== undefined) {
      this.weeklyVisitGoal = props.weeklyVisitGoal;
    }
    this.updatedAt = new Date();
  }

  activate(): void {
    this.isActive = true;
    this.updatedAt = new Date();
  }

  deactivate(): void {
    this.isActive = false;
    this.updatedAt = new Date();
  }
}
