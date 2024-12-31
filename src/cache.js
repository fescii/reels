// MinHeap implementation for tracking cache expiry
export default class ExpiryHeap {
  constructor() {
    this.heap = [];
  }

  getParentIndex(index) {
    return Math.floor((index - 1) / 2);
  }

  getLeftChildIndex(index) {
    return 2 * index + 1;
  }

  getRightChildIndex(index) {
    return 2 * index + 2;
  }

  swap(index1, index2) {
    const temp = this.heap[index1];
    this.heap[index1] = this.heap[index2];
    this.heap[index2] = temp;
  }

  insert(item) {
    this.heap.push(item);
    this.heapifyUp(this.heap.length - 1);
  }

  heapifyUp(index) {
    while (index > 0) {
      const parentIndex = this.getParentIndex(index);
      if (this.heap[parentIndex].expiryTime > this.heap[index].expiryTime) {
        this.swap(index, parentIndex);
        index = parentIndex;
      } else {
        break;
      }
    }
  }

  remove() {
    if (this.heap.length === 0) return null;
    if (this.heap.length === 1) return this.heap.pop();

    const min = this.heap[0];
    this.heap[0] = this.heap.pop();
    this.heapifyDown(0);

    return min;
  }

  heapifyDown(index) {
    while (true) {
      let minIndex = index;
      const leftChild = this.getLeftChildIndex(index);
      const rightChild = this.getRightChildIndex(index);

      if (leftChild < this.heap.length && 
          this.heap[leftChild].expiryTime < this.heap[minIndex].expiryTime) {
        minIndex = leftChild;
      }

      if (rightChild < this.heap.length && 
          this.heap[rightChild].expiryTime < this.heap[minIndex].expiryTime) {
        minIndex = rightChild;
      }

      if (minIndex === index) break;

      this.swap(index, minIndex);
      index = minIndex;
    }
  }

  peek() {
    return this.heap[0] || null;
  }

  size() {
    return this.heap.length;
  }
}