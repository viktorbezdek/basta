import "colors"
import { IReporter } from "./reporter.interface"
import { IClones } from "../storage/clones.interface"
import { IStatistic } from "../storage/statistic.interface"
import { IOptions } from "../options.interface"
import { IMaps } from "../storage/maps.interface"

export class ConsoleJsonReporter implements IReporter {
  report(
    options: IOptions,
    {
      clones,
      statistic,
      maps,
    }: { clones: IClones; statistic: IStatistic; maps: IMaps }
  ) {
    const report = JSON.stringify(
      {
        ...statistic.get(),
        clones: clones
          .get()
      },
      null,
      2
    )
    console.log(report)
  }
}
