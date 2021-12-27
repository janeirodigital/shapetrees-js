// Corresponding shapetrees-java package: com.janeirodigital.shapetrees.tests
import { ResourceAttributes } from '@shapetrees/core/src/ResourceAttributes';

class ResourceAttributesTests {

  // @Test, @DisplayName("Initialize empty ResourceAttributes"), @SneakyThrows
  initializeEmptyResourceAttributes(): void {
    let resourceAttributes: ResourceAttributes = new ResourceAttributes();
    expect(resourceAttributes).not.toBeNull();
  }

  // @Test, @DisplayName("Initialize ResourceAttributes with value pair"), @SneakyThrows
  initializeResourceAttributesWithPair(): void {
    let attribute: string = "Attribute";
    let value: string = "Value";
    let resourceAttributes: ResourceAttributes = new ResourceAttributes(attribute, value);
    expect(resourceAttributes).not.toBeNull();
    expect(resourceAttributes.toMultimap().has(attribute)).toEqual(true);
  }

  // @Test, @DisplayName("Initialize ResourceAttributes with Map"), @SneakyThrows
  initializeResourceAttributesWithMap(): void {
    let attributeStrings1: Array<string> = new Array<string>();
    let attributeStrings2: Array<string> = new Array<string>();
    let attributesMap: Map<string, Array<string>> = new Map<string, Array<string>>();
    attributeStrings1.push("string1");
    attributeStrings1.push("string2");
    attributeStrings2.push("string3");
    attributeStrings2.push("string4");
    attributesMap.set("attribute1", attributeStrings1);
    attributesMap.set("attribute2", attributeStrings2);
    let resourceAttributes: ResourceAttributes = new ResourceAttributes(attributesMap);
    expect(resourceAttributes).not.toBeNull();
    expect(resourceAttributes.toMultimap()).toEqual(attributesMap);
  }

  // @Test, @DisplayName("Add pairs with MaybePlus"), @SneakyThrows
  addPairsWithMaybePlus(): void {
    let resourceAttributes: ResourceAttributes = new ResourceAttributes();
    expect(resourceAttributes).not.toBeNull();
    let resourceAttributes2: ResourceAttributes = resourceAttributes.maybePlus(null, "value");
    expect(resourceAttributes2.toMultimap().size === 0).toEqual(true);
    resourceAttributes2 = resourceAttributes.maybePlus("attribute", null);
    expect(resourceAttributes2.toMultimap().size === 0).toEqual(true);
    resourceAttributes2 = resourceAttributes.maybePlus(null, null);
    expect(resourceAttributes2.toMultimap().size === 0).toEqual(true);
    expect(resourceAttributes).toEqual(resourceAttributes2);
    resourceAttributes2 = resourceAttributes.maybePlus("Attributes", "First Value");
    expect(resourceAttributes).not.toEqual(resourceAttributes2);
    expect(resourceAttributes2.toMultimap().size === 0).toEqual(false);
    expect(resourceAttributes2.toMultimap().has("Attributes")).toEqual(true);
    let resourceAttributes3: ResourceAttributes = resourceAttributes2.maybePlus("Attributes2", "Another First Value");
    expect(resourceAttributes2).not.toEqual(resourceAttributes3);
    expect(resourceAttributes3.toMultimap().size === 0).toEqual(false);
    expect(resourceAttributes3.toMultimap().has("Attributes")).toEqual(true);
    expect(resourceAttributes3.toMultimap().has("Attributes2")).toEqual(true);
  }

  // @Test, @DisplayName("Add pairs with MaybeSet"), @SneakyThrows
  addPairsWithMaybeSet(): void {
    let resourceAttributes: ResourceAttributes = new ResourceAttributes();
    expect(resourceAttributes).not.toBeNull();
    resourceAttributes.maybeSet(null, "value");
    expect(resourceAttributes.toMultimap().size === 0).toEqual(true);
    resourceAttributes.maybeSet("attribute", null);
    expect(resourceAttributes.toMultimap().size === 0).toEqual(true);
    resourceAttributes.maybeSet(null, null);
    expect(resourceAttributes.toMultimap().size === 0).toEqual(true);
    resourceAttributes.maybeSet("First Attribute", "First Attribute First Value");
    expect(resourceAttributes.firstValue("First Attribute")).toEqual("First Attribute First Value");
    // Try to reset with the same attribute and value (to no change)
    resourceAttributes.maybeSet("First Attribute", "First Attribute First Value");
    expect(1).toEqual(resourceAttributes.toMultimap().size);
    expect("First Attribute First Value").toEqual(resourceAttributes.firstValue("First Attribute"));
    // Add to the same attribute with a different value, growing the list size
    resourceAttributes.maybeSet("First Attribute", "First Attribute Second Value");
    expect(1).toEqual(resourceAttributes.toMultimap().size);
    expect(2).toEqual(resourceAttributes.allValues("First Attribute").length);
  }
}
