"""Helper functions for analysis through a notebook."""

import matplotlib.pyplot as plt
import numpy as np

# Assumes a global df DataFrame object

def to_time_delta(start=None, timestamps=None):
    return (np.array(timestamps) - start) / (1 * 1000) # ms to s

def scalarxy(ycol=None):
    """Get x and y arrays with one data point for each row.

    x axis represents the row index.
    y axis represents one scalar value for each row.

    Args:
      ycol: Column to be used as y (scalar data type).

    Returns:
      x, y: Arrays with x and y values.

    """
    x, y = df.index, df[ycol]
    return x, y

def xy(index=None, xcol=None, ycol=None):
    """Get x and y from values in columns.

    Args:
      index: Index of the row.
      xcol: Column to be used as x.
      ycol: Column to be used as y.

    Returns:
      x, y: Arrays with x and y values.

    """
    x, y = df[xcol][index], df[ycol][index]
    return x,y

def nestedxy(index=None, maincol=None, xcol=None, ycol=None):
    """Get x and y from values in nested columns.

    Args:
      index: Index of the row.
      maincol: Main column name.
      xcol: Nested column to be used as x.
      ycol: Nested column to be used as y.

    Returns:
      x, y: Arrays with x and y values.

    """
    series = df[maincol][index] # Values from the main column
    x, y = series[xcol], series[ycol]

    start_time = df['startTime'][index]
    if xcol == 'time':
        x = to_time_delta(start=start_time, timestamps=series['time'])
    if ycol == 'time':
        y = to_time_delta(start=start_time, timestamps=series['time'])
    return x, y


def annotate(ax=None, x=None, y=None, xytext=(0,5)):
    """Annotate points with y value.

    Args:
      ax: Optional axis to use, else use global plot.
      x: List of x values.
      y: List of y values.

    """
    for i, j in zip(x, y):
        if np.isnan(i) or np.isnan(j):
            continue
        pl = plt if ax is None else ax
        pl.annotate(int(j), xy=(i,j), xytext=xytext,
                    textcoords='offset points')
