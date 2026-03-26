// DSA Pattern Files
import arrays from "./dsa/arrays.json";
import backtracking from "./dsa/backtracking.json";
import binarySearch from "./dsa/binary-search.json";
import bitManipulation from "./dsa/bit-manipulation.json";
import concurrency from "./dsa/concurrency.json";
import dp1d from "./dsa/dp-1d.json";
import dp2d from "./dsa/dp-2d.json";
import dpBitmask from "./dsa/dp-bitmask.json";
import dpIntervals from "./dsa/dp-intervals.json";
import dpKnapsack from "./dsa/dp-knapsack.json";
import dpStrings from "./dsa/dp-strings.json";
import dpSubsequences from "./dsa/dp-subsequences.json";
import dpTrees from "./dsa/dp-trees.json";
import graphs from "./dsa/graphs.json";
import greedy from "./dsa/greedy.json";
import heaps from "./dsa/heaps.json";
import intervals from "./dsa/intervals.json";
import linkedLists from "./dsa/linked-lists.json";
import math from "./dsa/math.json";
import matrix from "./dsa/matrix.json";
import monotonicStack from "./dsa/monotonic-stack.json";
import recursionDivideConquer from "./dsa/recursion-divide-conquer.json";
import slidingWindow from "./dsa/sliding-window.json";
import stackQueue from "./dsa/stack-queue.json";
import trees from "./dsa/trees.json";
import tries from "./dsa/tries.json";
import twoPointers from "./dsa/two-pointers.json";
import unionFind from "./dsa/union-find.json";

// System Design & Other Categories
import hld from "./hld.json";
import lld from "./lld.json";
import behavioral from "./behavioral.json";

// Type definition for all items
export interface Company {
  name: string;
  frequency: number;
}

export interface ContentItem {
  slug: string;
  title: string;
  url: string;
  difficulty: string;
  companies: Company[];
  tags: string[];
  displayOrder: number;
}

// DSA exports organized by pattern
export const dsa = {
  arrays,
  backtracking,
  binarySearch,
  bitManipulation,
  concurrency,
  dp1d,
  dp2d,
  dpBitmask,
  dpIntervals,
  dpKnapsack,
  dpStrings,
  dpSubsequences,
  dpTrees,
  graphs,
  greedy,
  heaps,
  intervals,
  linkedLists,
  math,
  matrix,
  monotonicStack,
  recursionDivideConquer,
  slidingWindow,
  stackQueue,
  trees,
  tries,
  twoPointers,
  unionFind,
} as const;

// All DSA problems flattened into a single array
export const allDsaProblems: ContentItem[] = Object.values(dsa).flat() as ContentItem[];

// Named exports for each category
export {
  arrays,
  backtracking,
  binarySearch,
  bitManipulation,
  concurrency,
  dp1d,
  dp2d,
  dpBitmask,
  dpIntervals,
  dpKnapsack,
  dpStrings,
  dpSubsequences,
  dpTrees,
  graphs,
  greedy,
  heaps,
  intervals,
  linkedLists,
  math,
  matrix,
  monotonicStack,
  recursionDivideConquer,
  slidingWindow,
  stackQueue,
  trees,
  tries,
  twoPointers,
  unionFind,
  hld,
  lld,
  behavioral,
};

// Summary counts
export const counts = {
  dsa: allDsaProblems.length,
  hld: (hld as ContentItem[]).length,
  lld: (lld as ContentItem[]).length,
  behavioral: (behavioral as ContentItem[]).length,
  total:
    allDsaProblems.length +
    (hld as ContentItem[]).length +
    (lld as ContentItem[]).length +
    (behavioral as ContentItem[]).length,
} as const;

// DSA pattern metadata
export const dsaPatterns = [
  { key: "arrays", label: "Arrays & Strings", count: arrays.length },
  { key: "backtracking", label: "Backtracking", count: backtracking.length },
  { key: "binarySearch", label: "Binary Search", count: binarySearch.length },
  { key: "bitManipulation", label: "Bit Manipulation", count: bitManipulation.length },
  { key: "concurrency", label: "Concurrency", count: concurrency.length },
  { key: "dp1d", label: "DP - 1D", count: dp1d.length },
  { key: "dp2d", label: "DP - 2D", count: dp2d.length },
  { key: "dpBitmask", label: "DP - Bitmask", count: dpBitmask.length },
  { key: "dpIntervals", label: "DP - Intervals", count: dpIntervals.length },
  { key: "dpKnapsack", label: "DP - Knapsack", count: dpKnapsack.length },
  { key: "dpStrings", label: "DP - Strings", count: dpStrings.length },
  { key: "dpSubsequences", label: "DP - Subsequences", count: dpSubsequences.length },
  { key: "dpTrees", label: "DP - Trees", count: dpTrees.length },
  { key: "graphs", label: "Graphs", count: graphs.length },
  { key: "greedy", label: "Greedy", count: greedy.length },
  { key: "heaps", label: "Heaps / Priority Queue", count: heaps.length },
  { key: "intervals", label: "Intervals", count: intervals.length },
  { key: "linkedLists", label: "Linked Lists", count: linkedLists.length },
  { key: "math", label: "Math & Number Theory", count: math.length },
  { key: "matrix", label: "Matrix / 2D Grid", count: matrix.length },
  { key: "monotonicStack", label: "Monotonic Stack", count: monotonicStack.length },
  { key: "recursionDivideConquer", label: "Recursion & Divide and Conquer", count: recursionDivideConquer.length },
  { key: "slidingWindow", label: "Sliding Window", count: slidingWindow.length },
  { key: "stackQueue", label: "Stack & Queue", count: stackQueue.length },
  { key: "trees", label: "Trees (Binary & BST)", count: trees.length },
  { key: "tries", label: "Tries", count: tries.length },
  { key: "twoPointers", label: "Two Pointers", count: twoPointers.length },
  { key: "unionFind", label: "Union Find", count: unionFind.length },
] as const;
