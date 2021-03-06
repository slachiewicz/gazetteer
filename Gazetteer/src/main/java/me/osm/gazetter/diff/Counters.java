package me.osm.gazetter.diff;

import org.joda.time.DateTime;

/**
 * Hold counters for different types of processed lines
 * 
 * @author dkiselev
 */
public final class Counters {
	
	/**
	 * Lines to remove
	 * */
	public long remove = 0;
	
	/**
	 * Add lines
	 * */
	public long add = 0;
	
	/**
	 * Use new lines
	 * */
	public long takeNew = 0;
	
	/**
	 * Use old lines
	 * */
	public long takeOld = 0;
	
	/**
	 * Old file lines hash
	 * */
	public int oldHash = 0;
	
	/**
	 * Old file timestamp
	 * */
	public DateTime oldTs = new DateTime(0);

	/**
	 * New file lines hash
	 * */
	public int newHash = 0;
	
	/**
	 * New file timestamp
	 * */
	public DateTime newTs = new DateTime(0);
}