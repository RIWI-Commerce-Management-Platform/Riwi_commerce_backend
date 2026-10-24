/**
 * Advisor read port for the routes module, so it can check who a route is
 * assigned to without depending on the advisors module's tables (HU-07).
 */
export abstract class RouteAdvisorReaderPort {
  /**
   * True when the user exists, has the ASESOR role and is not deactivated.
   */
  abstract isActiveAdvisor(advisorId: number): Promise<boolean>;
}
