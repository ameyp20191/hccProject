"""Combine individual logs into one big JSON file."""

import json


def transform_log(fname, extra):
    """Transform a log by adding some extra data.

    The log should be parseable as a dictionary. Extra data will be added to
    this dictionary as key/value pairs.

    Args:
      fname: Path of the log file.
      extra: Extra information to add, dictionary.

    Returns:
      Parsed log with extra data added.

    """
    with open(fname, 'r') as f:
        data = json.load(f)
        data.update(extra)

    return data


def combine_logs(log_info):
    """Combine logs into one object.

    Args:
      log_info: List of (fname, extra) tuples for each log file.

    Returns:
      List of parsed logs.

    """
    print "Combining logs: "
    print log_info

    combined = []
    for fname, extra in log_info:
        combined.append(transform_log(fname, extra))

    return combined


def main():
    # Common keys
    name, state, when, length = 'name', 'state', 'when', 'length'

    # Common values
    on, off = 'ON', 'OFF'
    first, second = 1, 2
    min_30 = 30

    # Add log info here
    sr_logs = [('sw_on_off/on.json',
                {name: 'SR', state: on, when: first, length: min_30}),
               ('sw_on_off/off.json',
                {name: 'SR', state: off, when: second, length: min_30})]

    zy_logs = [('zy_on_off/on.json',
                {name: 'ZY', state: on, when: first, length: min_30}),
               ('zy_on_off/off.json',
                {name: 'ZY', state: off, when: second, length: min_30})]

    wk_logs = [('wk_on_off/on.json',
                {name: 'WK', state: on, when: first, length: min_30}),
               ('wk_on_off/off.json',
                {name: 'WK', state: off, when: second, length: min_30})]

    xi_logs = [('xi_off_on/on.json',
                {name: 'XI', state: on, when: second, length: min_30}),
               ('xi_off_on/off.json',
                {name: 'XI', state: off, when: first, length: min_30})]


    all_logs_mixed = [sr_logs, zy_logs, wk_logs, xi_logs]

    # Make proper log_info list
    all_logs = []
    for log_info in all_logs_mixed:
        if isinstance(log_info, list):
            all_logs.extend(log_info)
        else:
            all_logs.append(log_info)

    combined = combine_logs(all_logs)
    out = './combined.json'
    with open(out, 'w') as f:
        json.dump(combined, f)
    print "Combined logs saved to %s." % (out)


if __name__ == "__main__":
    main()
